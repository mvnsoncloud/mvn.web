const Auth = {
  getCurrentUser() {
    const userStr = localStorage.getItem("mvn_current_user");
    return userStr ? JSON.parse(userStr) : null;
  },

  async register({ fullName, email, password, role, skills }) {
    if (CONFIG.USE_MOCK_DB) {
      const users = JSON.parse(localStorage.getItem("mvn_users") || "[]");
      if (users.find((u) => u.email === email)) {
        throw new Error("An account with this email already exists.");
      }
      const newUser = {
        id: Date.now().toString(),
        fullName,
        email,
        password,
        role,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean)
      };
      users.push(newUser);
      localStorage.setItem("mvn_users", JSON.stringify(users));
      localStorage.setItem("mvn_current_user", JSON.stringify(newUser));
      return newUser;
    } else {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role, skills }
        }
      });
      if (error) throw error;
      return data.user;
    }
  },

  async login(email, password) {
    if (CONFIG.USE_MOCK_DB) {
      const users = JSON.parse(localStorage.getItem("mvn_users") || "[]");
      const user = users.find((u) => u.email === email && u.password === password);
      if (!user) {
        throw new Error("Invalid email or password.");
      }
      localStorage.setItem("mvn_current_user", JSON.stringify(user));
      return user;
    } else {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data.user;
    }
  },

  async logout() {
    if (!CONFIG.USE_MOCK_DB) {
      await supabaseClient.auth.signOut();
    }
    localStorage.removeItem("mvn_current_user");
    window.location.href = "login.html";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const errorBox = document.getElementById("authError");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.style.display = "none";
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      try {
        await Auth.login(email, password);
        window.location.href = "feed.html";
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.style.display = "block";
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.style.display = "none";
      const fullName = document.getElementById("regName").value.trim();
      const email = document.getElementById("regEmail").value.trim();
      const role = document.getElementById("regRole").value.trim();
      const skills = document.getElementById("regSkills").value.trim();
      const password = document.getElementById("regPassword").value;

      try {
        await Auth.register({ fullName, email, password, role, skills });
        window.location.href = "feed.html";
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.style.display = "block";
      }
    });
  }
});
