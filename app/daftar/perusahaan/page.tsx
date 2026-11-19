import RegistrationPage from '../../components/RegistrationPage';

export const metadata = { title: 'Daftar Perusahaan | Lestari' };

export default function CompanySignup({ searchParams }: { searchParams: { google?: string } }) {
  return <RegistrationPage role="company" googleError={searchParams.google} />;
}
