<?php

namespace App\Notifications;

use App\Models\Property;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PropertyRejected extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Property $property, public string $reason) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim(config('app.frontend_url', config('app.url')), '/')
            .'/quan-ly/tin-dang/'.$this->property->id.'/sua';

        return (new MailMessage)
            ->subject('Tin đăng của bạn chưa được duyệt')
            ->greeting('Xin chào '.$notifiable->name.',')
            ->line('Tin đăng "'.$this->property->title.'" chưa được duyệt.')
            ->line('Lý do: '.$this->reason)
            ->line('Bạn có thể chỉnh sửa và gửi duyệt lại.')
            ->action('Chỉnh sửa tin', $url);
    }
}
