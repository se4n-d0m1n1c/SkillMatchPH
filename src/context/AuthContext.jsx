import React, { createContext, useContext, useEffect, useState } from 'react';
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // PGRST116 means no rows returned (profile not created yet by trigger)
      if (error.code === 'PGRST116') {
        return { role: 'student', status: 'pending' };
      }
      throw error;
    }

    return data;
  };

  const roleRef = React.useRef(role);
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setRole(null);
        setStatus(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Use ref to avoid stale closure (role is always null in this closure otherwise)
        if (!roleRef.current) {
          setLoading(true);
          try {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
            setRole(profileData.role);
            setStatus(profileData.status);
          } catch (error) {
            console.error('Error fetching profile:', error);
          }
        }
      }

      setLoading(false);
    });

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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });

    if (error) {
      console.error('Signup error:', error.message);
    }

    return { data, error };
  };

  const signIn = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    // State is cleared reactively via onAuthStateChange(SIGNED_OUT)
    await supabase.auth.signOut();
  };

  const value = React.useMemo(() => ({
    signUp,
    signIn,
    signOut,
    user,
    session,
    role,
    status,
    profile,
    loading,
  }), [user, session, role, status, profile, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
