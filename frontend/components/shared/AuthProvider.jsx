import { createContext, useContext, useState, useEffect } from 'react';
import { insforge } from '../../utils/insforge';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Check active session using getCurrentUser
    insforge.auth.getCurrentUser().then(({ data, error }) => {
      if (isMounted) {
        setUser(data?.user ?? null);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = {
    user,
    signInWithGoogle: () => insforge.auth.signInWithOAuth('google', { redirectTo: window.location.origin + '/dashboard' }),
    signInWithPassword: (email, password) => insforge.auth.signInWithPassword({ email, password }).then((res) => {
      if (res.data?.user) {
        setUser(res.data.user);
        if (res.data.accessToken) localStorage.setItem('insforge_token', res.data.accessToken);
      }
      return res;
    }),
    signUp: (email, password) => insforge.auth.signUp({ email, password }).then((res) => {
      if (res.data?.user) {
        setUser(res.data.user);
        if (res.data.accessToken) localStorage.setItem('insforge_token', res.data.accessToken);
      }
      return res;
    }),
    signOut: () => insforge.auth.signOut().then(() => {
      setUser(null);
      localStorage.removeItem('insforge_token');
    }),
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
