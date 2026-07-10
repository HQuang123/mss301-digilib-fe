import { Eye, GraduationCap, Lightbulb, ShieldCheck, SquareLibrary } from 'lucide-react'
import heroImage from '@/assets/about-library-hero.png'
import leaderQuanImage from '@/assets/leader-quan.png'
import leaderChiImage from '@/assets/leader-chi.png'
import leaderNamImage from '@/assets/leader-nam.png'
import leaderAnhImage from '@/assets/leader-anh.png'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'

const missionCards = [
  {
    icon: SquareLibrary,
    title: 'Sứ mệnh',
    description:
      'Readora cam kết thúc đẩy sự xuất sắc trong nghiên cứu và học tập bằng cách cung cấp quyền truy cập không giới hạn vào các nguồn tài liệu học thuật chất lượng cao. Chúng tôi nỗ lực bảo tồn và lan tỏa tri thức dưới định dạng kỹ thuật số bền vững cho thế hệ mai sau.',
  },
  {
    icon: Eye,
    title: 'Tầm nhìn',
    description:
      'Trở thành thư viện số hàng đầu khu vực, là trung tâm hội tụ của cộng đồng học thuật toàn cầu. Chúng tôi hướng tới việc tích hợp trí tuệ nhân tạo để cá nhân hóa hành trình khám phá kiến thức, biến Readora thành một thực thể số thông minh và không ngừng phát triển.',
  },
]

const coreValues = [
  { icon: ShieldCheck, title: 'Tin cậy', description: 'Thông tin được xác thực bởi các chuyên gia hàng đầu và các tổ chức học thuật uy tín trên thế giới.' },
  { icon: Lightbulb, title: 'Đổi mới', description: 'Tiên phong ứng dụng công nghệ hiện đại vào quản trị dữ liệu và trải nghiệm người dùng.' },
  { icon: GraduationCap, title: 'Học thuật', description: 'Tôn trọng sự liêm chính và các tiêu chuẩn khắt khe trong nghiên cứu khoa học.' },
]

const leaders = [
  {
    name: 'GS.TS. Đặng Minh Quân',
    role: 'Giám đốc điều hành',
    summary: 'Định hướng chiến lược phát triển thư viện số và mở rộng kết nối học thuật trong nước, quốc tế.',
    image: leaderQuanImage,
  },
  {
    name: 'PGS.TS. Lê Thùy Chi',
    role: 'Giám đốc học thuật',
    summary: 'Phụ trách chuẩn hóa nội dung, chất lượng học liệu và các chương trình hỗ trợ nghiên cứu chuyên sâu.',
    image: leaderChiImage,
  },
  {
    name: 'ThS. Nguyễn Hoàng Nam',
    role: 'Giám đốc công nghệ',
    summary: 'Dẫn dắt hạ tầng nền tảng, dữ liệu số và các trải nghiệm tra cứu hiện đại cho người dùng.',
    image: leaderNamImage,
  },
  {
    name: 'Bà Trần Minh Anh',
    role: 'Trưởng bộ phận lưu trữ',
    summary: 'Chịu trách nhiệm bảo tồn tài nguyên số, chuẩn hóa metadata và vận hành kho lưu trữ bền vững.',
    image: leaderAnhImage,
  },
]

function AboutUs() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Header />

      <main>
        <section className="relative min-h-[240px] overflow-hidden px-4 text-center sm:px-6 lg:px-8">
          <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/75 to-white" />
          <div className="relative mx-auto flex min-h-[240px] max-w-3xl flex-col items-center justify-center pb-5">
            <h1 className="font-serif text-[30px] font-semibold tracking-tight sm:text-[34px]">Về Readora</h1>
            <p className="mt-3 max-w-2xl text-[14px] font-medium leading-7 text-slate-600">
              Kiến tạo cầu nối tri thức, nâng tầm giá trị học thuật thông qua giải pháp lưu trữ số hiện đại và bảo tồn di sản trí tuệ nhân loại.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-8 pt-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          {missionCards.map((card) => {
            const Icon = card.icon
            return (
              <article key={card.title} className="rounded-md border border-slate-300 bg-white p-5">
                <Icon size={26} className="text-slate-950" />
                <h2 className="mt-4 font-serif text-[24px] font-semibold tracking-tight">{card.title}</h2>
                <p className="mt-3 text-[13px] leading-6 text-slate-600">{card.description}</p>
              </article>
            )
          })}
        </section>

        <section className="bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="font-serif text-[26px] font-semibold tracking-tight">Giá trị cốt lõi</h2>
              <span className="mx-auto mt-3 block h-1 w-14 bg-[#817000]" />
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {coreValues.map((value) => {
                const Icon = value.icon
                return (
                  <article key={value.title} className="rounded-sm border border-slate-300 bg-white px-5 py-5 text-center">
                    <span className="mx-auto grid h-11 w-11 place-items-center rounded-md bg-[#082b51] text-white">
                      <Icon size={18} />
                    </span>
                    <h3 className="mt-3 font-serif text-lg font-semibold">{value.title}</h3>
                    <p className="mx-auto mt-2.5 max-w-xs text-[13px] leading-6 text-slate-600">{value.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-serif text-[26px] font-semibold tracking-tight">Đội ngũ lãnh đạo</h2>
            <p className="mt-2 text-[14px] leading-7 text-slate-600">
              Những người dẫn dắt sứ mệnh nâng tầm tri thức tại Readora với nền tảng học thuật, công nghệ và lưu trữ chuyên sâu.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {leaders.map((leader) => (
              <article key={leader.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
                <div className="bg-gradient-to-b from-slate-100 to-slate-200 p-1">
                  <div className="aspect-square overflow-hidden rounded-2xl bg-white/60">
                    <img src={leader.image} alt={leader.name} className="h-[108%] w-full object-cover object-top" />
                  </div>
                </div>

                <div className="p-4">
                  <p className="inline-flex rounded-full bg-[#f3eed0] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6d5f00]">
                    {leader.role}
                  </p>
                  <h3 className="mt-3 min-h-[72px] font-serif text-[19px] font-semibold leading-9 text-slate-950">
                    {leader.name}
                  </h3>
                  <p className="line-clamp-4 text-[13px] leading-6 text-slate-600">
                    {leader.summary}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}

export default AboutUs
