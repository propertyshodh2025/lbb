(async () => {
  const SUPABASE_PROJECT_ID = 'lzwxlbanmacwhycmvnhu';
  const CREATE_USER_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/create-user`;

  // Ensure supabase client is available and get the session
  if (typeof window.supabase === 'undefined') {
    console.error("Supabase client not found. Please ensure 'supabase' is globally available (e.g., from src/integrations/supabase/client.ts).");
    return;
  }

  const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();

  if (sessionError || !session) {
    console.error("Failed to get Supabase session. Please ensure you are logged in as an Admin.");
    return;
  }

  const adminAccessToken = session.access_token;

  const usersToCreate = [
    { email: 'admin@example.com', password: 'password', first_name: 'Admin', last_name: 'User', role: 'admin' },
    { email: 'manager@example.com', password: 'password', first_name: 'Manager', last_name: 'User', role: 'manager' },
    { email: 'editor@example.com', password: 'password', first_name: 'Editor', last_name: 'User', role: 'editor' },
    { email: 'client@example.com', password: 'password', first_name: 'Client', last_name: 'User', role: 'client' },
  ];

  console.log("Attempting to create test users...");

  for (const user of usersToCreate) {
    try {
      console.log(`Creating user: ${user.email} with role: ${user.role}...`);
      const response = await fetch(CREATE_USER_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify(user),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(`Error creating ${user.role} user (${user.email}):`, result.error);
      } else {
        console.log(`Successfully created ${user.role} user (${user.email}). User ID: ${result.userId}`);
      }
    } catch (error) {
      console.error(`An unexpected error occurred while creating ${user.role} user (${user.email}):`, error);
    }
  }
  console.log("Finished attempting to create test users.");
})();