const DB = {
  seedMockData() {
    if (!localStorage.getItem("mvn_posts")) {
      const initialPosts = [
        {
          id: "1",
          author_name: "Alex Kamau",
          author_role: "Full-Stack Developer",
          skills: ["React", "Node.js", "PostgreSQL"],
          title: "Open for Freelance SaaS & API Architecture",
          content: "Built 4 scalable fintech backends this year. Looking to collaborate with UI/UX designers or startups needing an MVP built fast.",
          portfolio_link: "https://github.com",
          likes: 14,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: "2",
          author_name: "Sarah Wanjiku",
          author_role: "UI/UX & Product Designer",
          skills: ["Figma", "Design Systems", "Prototyping"],
          title: "Redesigned a Mobile Banking App — Case Study",
          content: "Focused on reducing checkout friction by 40%. Available for contract design roles and design audits.",
          portfolio_link: "https://dribbble.com",
          likes: 29,
          created_at: new Date(Date.now() - 3600000 * 5).toISOString()
        }
      ];
      localStorage.setItem("mvn_posts", JSON.stringify(initialPosts));
    }
  },

  async getPosts() {
    if (CONFIG.USE_MOCK_DB) {
      this.seedMockData();
      const posts = JSON.parse(localStorage.getItem("mvn_posts") || "[]");
      return posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      const { data, error } = await supabaseClient
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  },

  async createPost(postData) {
    if (CONFIG.USE_MOCK_DB) {
      const posts = JSON.parse(localStorage.getItem("mvn_posts") || "[]");
      const newPost = {
        id: Date.now().toString(),
        ...postData,
        likes: 0,
        created_at: new Date().toISOString()
      };
      posts.unshift(newPost);
      localStorage.setItem("mvn_posts", JSON.stringify(posts));
      return newPost;
    } else {
      const { data, error } = await supabaseClient
        .from("posts")
        .insert([postData])
        .select();
      if (error) throw error;
      return data[0];
    }
  },

  async likePost(postId) {
    if (CONFIG.USE_MOCK_DB) {
      const posts = JSON.parse(localStorage.getItem("mvn_posts") || "[]");
      const index = posts.findIndex((p) => p.id === postId);
      if (index !== -1) {
        posts[index].likes += 1;
        localStorage.setItem("mvn_posts", JSON.stringify(posts));
        return posts[index].likes;
      }
    } else {
      const { data } = await supabaseClient.rpc("increment_likes", { post_id: postId });
      return data;
    }
  }
};
