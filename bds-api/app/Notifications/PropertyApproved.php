<?php

namespace App\Notifications;

use App\Models\Property;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PropertyApproved extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Property $property) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim(config('app.frontend_url', config('app.url')), '/')
            .'/bat-dong-san/'.$this->property->slug;

        return (new MailMessage)
            ->subject('Tin đăng của bạn đã được duyệt')
            ->greeting('Xin chào '.$notifiable->name.',')
            ->line('Tin đăng "'.$this->property->title.'" đã được duyệt và đang hiển thị trên hệ thống.')
            ->line('Tin sẽ hiển thị đến ngày '.$this->property->expired_at?->format('d/m/Y').'.')
            ->action('Xem tin đăng', $url)
            ->line('Cảm ơn bạn đã sử dụng dịch vụ.');
    }
}
