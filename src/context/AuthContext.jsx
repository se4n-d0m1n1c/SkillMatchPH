import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { role: 'student', status: 'pending' };
      }

      return data;
    } catch (err) {
      return { role: 'student', status: 'pending' };
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    const setData = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
          setRole(profileData.role);
          setStatus(profileData.status);
        }
      } catch (error) {
        console.error('Error fetching session:', error.message);
      } finally {
        setLoading(false);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
        setRole(profileData.role);
        setStatus(profileData.status);
      } else {
        setProfile(null);
        setRole(null);
        setStatus(null);
      }
      setLoading(false);
    });

    setData();

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, profileData) => {
    const metadata = {
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      student_no: profileData.studentNo,
      grade_level: profileData.gradeLevel,
      shs_track: profileData.shsTrack,
      shs_strand: profileData.shsStrand,
      status: 'pending',
      role: 'student',
    };

    console.log('--- SIGNUP DEBUG ---');
    console.log('Email:', email);
    console.log('Mapped Metadata:', metadata);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      console.error('SUPABASE ERROR:', error.message);
    }
    
    return { data, error };
  };

  const signIn = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    try {
      setSession(null);
      setUser(null);
      setRole(null);
      setStatus(null);

      await supabase.auth.signOut();
    } catch (error) {
      window.location.href = '/';
    }
  };

  const value = {
    signUp,
    signIn,
    signOut,
    user,
    session,
    role,
    status,
    profile,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
