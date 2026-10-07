<?php

namespace Tests\Unit;

use App\Services\IA\ConversationManager;
use App\Services\IA\OllamaService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class IntentClassificationTest extends TestCase
{
    private ConversationManager $manager;
    private ReflectionMethod $normalize;
    private ReflectionMethod $detect;

    protected function setUp(): void
    {
        parent::setUp();
        $this->manager = new ConversationManager(new OllamaService());
        $this->normalize = new ReflectionMethod($this->manager, 'normalizeText');
        $this->detect = new ReflectionMethod($this->manager, 'detectIntent');
        $this->normalize->setAccessible(true);
        $this->detect->setAccessible(true);
    }

    #[DataProvider('naturalLanguageIntentProvider')]
    public function test_natural_language_maps_to_expected_intent(string $text, string $expected): void
    {
        $normalized = $this->normalize->invoke($this->manager, $text);
        $result = $this->detect->invoke($this->manager, $normalized, ['menu_shown' => true]);

        $this->assertSame($expected, $result['intent']);
    }

    public static function naturalLanguageIntentProvider(): array
    {
        return [
            ['MENU', 'MENU'],
            ['quiero ver el menú', 'MENU'],
            ['quiero consultar mi saldo', 'CONSULTAR_SALDO'],
            ['ola kiero saver kuanto devo', 'CONSULTAR_SALDO'],
            ['quiero ver mi factura', 'VER_FACTURA'],
            ['mandame mi fakctura', 'VER_FACTURA'],
            ['quiero realizar un pago', 'REALIZAR_PAGO'],
            ['dónde puedo pagar', 'REALIZAR_PAGO'],
            ['no ai agua', 'REPORTAR_PROBLEMA'],
            ['hay un problema con el servicio', 'REPORTAR_PROBLEMA'],
            ['quiero ablar con alguien', 'HABLAR_OPERADOR'],
            ['quiero hablar con un operador', 'HABLAR_OPERADOR'],
        ];
    }

    #[DataProvider('menuNumberProvider')]
    public function test_menu_numbers_require_active_context(string $number, string $expected): void
    {
        $withoutMenu = $this->detect->invoke($this->manager, $number, []);
        $withMenu = $this->detect->invoke($this->manager, $number, ['menu_shown' => true]);

        $this->assertSame('otro', $withoutMenu['intent']);
        $this->assertSame($expected, $withMenu['intent']);
    }

    public static function menuNumberProvider(): array
    {
        return [['1', 'CONSULTAR_SALDO'], ['2', 'VER_FACTURA'], ['3', 'REALIZAR_PAGO'], ['4', 'REPORTAR_PROBLEMA'], ['6', 'HABLAR_OPERADOR']];
    }

    #[DataProvider('numericFalsePositiveProvider')]
    public function test_numbers_inside_sentences_are_not_menu_options(string $text): void
    {
        $normalized = $this->normalize->invoke($this->manager, $text);
        $result = $this->detect->invoke($this->manager, $normalized, ['menu_shown' => true]);

        $this->assertSame('otro', $result['intent']);
    }

    public static function numericFalsePositiveProvider(): array
    {
        return [
            ['mi medidor es el 1'],
            ['tengo 2 facturas'],
            ['pagué 3 veces'],
            ['tengo 4 problemas'],
        ];
    }
}
