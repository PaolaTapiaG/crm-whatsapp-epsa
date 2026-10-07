<?php

namespace App\Services;

use App\Models\Message;
use Carbon\CarbonImmutable;

class WhatsAppQuotaService
{
    public function usage(): array
    {
        $limit = max(1, (int) config('whatsapp.quota.free_service_messages'));
        $warningAt = min($limit, max(1, (int) config('whatsapp.quota.warning_threshold')));
        $criticalAt = min($limit, max($warningAt, (int) config('whatsapp.quota.critical_threshold')));
        $now = CarbonImmutable::now();
        $periodStart = $now->startOfMonth();
        $periodEnd = $now->endOfMonth();
        $used = Message::query()
            ->where('internal', false)
            ->whereIn('sender', ['bot', 'human'])
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->count();

        $remaining = max(0, $limit - $used);
        $percent = round(($used / $limit) * 100, 1);
        $status = match (true) {
            $used >= $limit => 'exceeded',
            $used >= $criticalAt => 'critical',
            $used >= $warningAt => 'warning',
            default => 'ok',
        };

        return [
            'status' => $status,
            'used' => $used,
            'limit' => $limit,
            'remaining' => $remaining,
            'percent' => $percent,
            'warning_at' => $warningAt,
            'critical_at' => $criticalAt,
            'period_start' => $periodStart->toDateString(),
            'period_end' => $periodEnd->toDateString(),
            'emergency_mode' => config('whatsapp.quota.emergency_mode'),
            'can_send' => $used < $limit || config('whatsapp.quota.emergency_mode') !== 'block_auto',
            'source' => 'crm_outgoing_messages',
        ];
    }

    public function ensureCanSend(): void
    {
        $quota = $this->usage();
        if ($quota['status'] === 'exceeded' && $quota['emergency_mode'] === 'block_auto') {
            throw new \App\Exceptions\WhatsAppQuotaExceededException($quota);
        }
    }
}
