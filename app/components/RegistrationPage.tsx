import { googleConfig } from '../server/google';
import type { SignupRole } from '../utils/signup';
import RegistrationView from './RegistrationView';

export default function RegistrationPage({ role, googleError }: { role: SignupRole; googleError?: string }) {
  return <RegistrationView role={role} googleError={googleError} googleAvailable={Boolean(googleConfig())} />;
}
