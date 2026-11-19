import RegistrationPage from '../../components/RegistrationPage';

export const metadata = { title: 'Daftar Pencari Kerja | Lestari' };

export default function JobseekerSignup({ searchParams }: { searchParams: { google?: string } }) {
  return <RegistrationPage role="jobseeker" googleError={searchParams.google} />;
}
