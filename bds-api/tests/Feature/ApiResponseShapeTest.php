<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Mọi endpoint phân trang phải trả cùng một hình dạng {data, links, meta}.
 *
 * Trước đây ProjectController trả thẳng paginator của Laravel (cấu trúc phẳng:
 * total nằm ở cấp 1, không có `meta`) nên trang /du-an ở frontend đọc
 * `page.meta.total` và đổ HTTP 500. Test này chặn việc lặp lại.
 */
class ApiResponseShapeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
    }

    /** @return array<string, array{string}> */
    public static function paginatedEndpoints(): array
    {
        return [
            'danh sách tin đăng' => ['/api/v1/properties'],
            'danh sách dự án' => ['/api/v1/projects'],
        ];
    }

    #[DataProvider('paginatedEndpoints')]
    public function test_endpoint_phan_trang_tra_ve_bao_data_links_meta(string $url): void
    {
        $response = $this->getJson($url);

        $response->assertOk()->assertJsonStructure([
            'data',
            'links' => ['first', 'last', 'prev', 'next'],
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ]);

        // Không được lộ cấu trúc paginator thô ra ngoài.
        $this->assertArrayNotHasKey('current_page', $response->json());
        $this->assertArrayNotHasKey('total', $response->json());
    }

    public function test_chi_tiet_du_an_tra_ve_bao_data_va_dem_dung_so_tin(): void
    {
        $base = $this->seedBaseData();
        $owner = $this->userWithRole('agent');

        $project = Project::create([
            'name' => 'Dự án kiểm thử',
            'slug' => 'du-an-kiem-thu',
            'developer' => 'CĐT kiểm thử',
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
            'status' => 'selling',
        ]);

        $common = [
            'user_id' => $owner->id,
            'category_id' => $base['category']->id,
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
            'project_id' => $project->id,
        ];

        Property::factory()->published()->create($common);
        Property::factory()->create($common); // tin chờ duyệt — không được tính

        $this->getJson("/api/v1/projects/{$project->slug}")
            ->assertOk()
            ->assertJsonPath('data.slug', 'du-an-kiem-thu')
            ->assertJsonPath('data.properties_count', 1);
    }
}
