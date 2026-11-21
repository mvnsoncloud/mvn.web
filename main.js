document.addEventListener("DOMContentLoaded", async () => {
  const user = Auth.getCurrentUser();

  // Protect feed.html if not logged in
  if (window.location.pathname.includes("feed.html") && !user) {
    window.location.href = "login.html";
    return;
  }

  // Update Navbar on index.html if user is logged in
  const navActions = document.getElementById("navActions");
  if (navActions && user) {
    navActions.innerHTML = `
      <a href="feed.html" class="btn btn-primary">Go to Tech Feed</a>
    `;
  }

  // Feed Page Logic
  const feedContainer = document.getElementById("feedContainer");
  if (feedContainer && user) {
    document.getElementById("profileName").textContent = user.fullName;
    document.getElementById("profileRole").textContent = user.role || "Tech Professional";
    document.getElementById("profileAvatar").textContent = user.fullName.charAt(0).toUpperCase();

    const profileSkillsDiv = document.getElementById("profileSkills");
    profileSkillsDiv.innerHTML = (user.skills || [])
      .map((skill) => `<span class="skill-tag">${skill}</span>`)
      .join("");

    document.getElementById("logoutBtn").addEventListener("click", () => Auth.logout());

    let allPosts = await DB.getPosts();
    renderPosts(allPosts);

    // Handle New Showcase Post
    const postForm = document.getElementById("createPostForm");
    postForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("postTitle").value.trim();
      const content = document.getElementById("postContent").value.trim();
      const skillsInput = document.getElementById("postSkills").value.trim();
      const portfolio_link = document.getElementById("postLink").value.trim();

      const skillsArray = skillsInput
        ? skillsInput.split(",").map((s) => s.trim()).filter(Boolean)
        : user.skills || [];

      await DB.createPost({
        author_name: user.fullName,
        author_role: user.role,
        skills: skillsArray,
        title,
        content,
        portfolio_link
      });

      postForm.reset();
      allPosts = await DB.getPosts();
      renderPosts(allPosts);
    });

    // Search / Skill Filter
    const searchInput = document.getElementById("searchFeed");
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = allPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(term) ||
          post.content.toLowerCase().includes(term) ||
          post.author_name.toLowerCase().includes(term) ||
          post.skills.some((s) => s.toLowerCase().includes(term))
      );
      renderPosts(filtered);
    });
  }
});

function renderPosts(posts) {
  const feedContainer = document.getElementById("feedContainer");
  if (!posts.length) {
    feedContainer.innerHTML = `<div class="empty-state">No tech showcases match your search.</div>`;
    return;
  }

  feedContainer.innerHTML = posts
    .map(
      (post) => `
    <article class="post-card">
      <div class="post-header">
        <div class="author-info">
          <div class="avatar-small">${post.author_name.charAt(0).toUpperCase()}</div>
          <div>
            <h4>${escapeHTML(post.author_name)}</h4>
            <span class="author-role">${escapeHTML(post.author_role)}</span>
          </div>
        </div>
        <span class="post-time">${timeAgo(post.created_at)}</span>
      </div>

      <h3 class="post-title">${escapeHTML(post.title)}</h3>
      <p class="post-body">${escapeHTML(post.content)}</p>

      <div class="post-skills">
        ${post.skills.map((s) => `<span class="skill-tag">${escapeHTML(s)}</span>`).join("")}
      </div>

      <div class="post-footer">
        <button class="btn-like" onclick="handleLike('${post.id}', this)">
          ▲ Endorse (<span>${post.likes}</span>)
        </button>
        ${
          post.portfolio_link
            ? `<a href="${escapeHTML(post.portfolio_link)}" target="_blank" rel="noopener" class="portfolio-link">View Project / Portfolio →</a>`
            : ""
        }
      </div>
    </article>
  `
    )
    .join("");
}

async function handleLike(postId, btnElement) {
  const newCount = await DB.likePost(postId);
  if (newCount !== undefined) {
    btnElement.querySelector("span").textContent = newCount;
    btnElement.classList.add("liked");
  }
}

function timeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>'"]/g, (tag) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[tag]));
}
