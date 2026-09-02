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

  const handleAuthStateChange = async (event, session) => {
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
  };

  useEffect(() => {
    // 1. Check current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleAuthStateChange('INITIAL_SESSION', session);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuthStateChange(event, session);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, profileData) => {
    const metadata = {
      username: profileData.username.trim().toLowerCase(),
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

  const verifySignupCode = async (email, token) => {
    return supabase.auth.verifyOtp({
      type: 'signup',
      email: email.trim().toLowerCase(),
      token: token.trim(),
    });
  };

  const resendVerificationEmail = async (email) => {
    return supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
    });
  };

  const signIn = async (identifier, password) => {
    const normalizedIdentifier = identifier.trim();

    const { data, error } = await supabase.functions.invoke('username-login', {
      body: { username: normalizedIdentifier, password },
    });
    if (error) {
      let message = data?.error;
      if (!message && error.context) {
        try {
          message = (await error.context.json()).error;
        } catch {
          // The function may be unreachable or return a non-JSON platform error.
        }
      }
      return { data: null, error: new Error(message || 'Invalid username or password') };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    return { data: sessionData, error: sessionError };
  };

  const signOut = async () => {
    // State is cleared reactively via onAuthStateChange(SIGNED_OUT)
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (!user?.id) return null;

    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
    setRole(profileData.role);
    setStatus(profileData.status);
    return profileData;
  };

  const value = React.useMemo(() => ({
    signUp,
    verifySignupCode,
    resendVerificationEmail,
    signIn,
    signOut,
    refreshProfile,
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
