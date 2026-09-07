<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('conversations.{conversationId}', fn ($user, $conversationId) => true);