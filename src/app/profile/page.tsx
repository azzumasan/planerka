import { getProfile } from "@/lib/queries";
import ProfileForm from "@/components/ProfileForm";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = getProfile();

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="01 · Личный кабинет"
        title="Личное дело"
        subtitle="Точка отсчёта для всей планёрки — кто ты, где ты и в какой ты форме."
      />
      <ProfileForm profile={profile} />
    </div>
  );
}
