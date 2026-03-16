import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function ProfilePage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return null;
}
