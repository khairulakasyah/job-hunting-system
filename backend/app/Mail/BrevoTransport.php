<?php

namespace App\Mail;

use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\MessageConverter;

class BrevoTransport extends AbstractTransport
{
    public function __construct(private string $apiKey = '')
    {
        parent::__construct();
    }

    public function __toString(): string
    {
        return 'brevo';
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $to = $this->formatAddresses($email->getTo());
        $cc = $this->formatAddresses($email->getCc());
        $bcc = $this->formatAddresses($email->getBcc());
        $replyTo = $this->formatAddresses($email->getReplyTo());

        $sender = $email->getSender() ?? ($email->getFrom()[0] ?? null);

        $payload = [
            'sender' => $sender
                ? ['email' => $sender->getAddress(), 'name' => $sender->getName()]
                : null,
            'to' => $to,
            'subject' => (string) $email->getSubject(),
        ];

        if ($email->getHtmlBody() !== null) {
            $payload['htmlContent'] = (string) $email->getHtmlBody();
        }

        if ($email->getTextBody() !== null) {
            $payload['textContent'] = (string) $email->getTextBody();
        }

        if ($cc !== []) {
            $payload['cc'] = $cc;
        }

        if ($bcc !== []) {
            $payload['bcc'] = $bcc;
        }

        if ($replyTo !== []) {
            $payload['replyTo'] = $replyTo[0];
        }

        $attachments = [];
        foreach ($email->getAttachments() as $attachment) {
            $attachments[] = [
                'content' => base64_encode($attachment->getBody()),
                'name' => $attachment->getFilename() ?? 'attachment',
            ];
        }

        if ($attachments !== []) {
            $payload['attachment'] = $attachments;
        }

        $response = Http::withHeaders([
            'api-key' => $this->apiKey,
            'accept' => 'application/json',
        ])->post('https://api.brevo.com/v3/smtp/email', $payload);

        if ($response->failed()) {
            throw new \RuntimeException(
                'Brevo API error (' . $response->status() . '): ' . $response->body()
            );
        }
    }

    private function formatAddresses(array $addresses): array
    {
        return array_map(
            fn (Address $address) => [
                'email' => $address->getAddress(),
                'name' => $address->getName(),
            ],
            $addresses
        );
    }
}
