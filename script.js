(function () {
  "use strict";

  // ─── Loading Screen ───────────────────────────────────────────────────────────
  window.addEventListener("load", function () {
    setTimeout(function () {
      var ls = document.getElementById("loading-screen");
      if (ls) ls.classList.add("hidden");
    }, 400);
  });

  // ─── Fade-in on Scroll ────────────────────────────────────────────────────────
  var faders = document.querySelectorAll(".fade-in");
  if ("IntersectionObserver" in window) {
    var appearOnScroll = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          // Animate skill bars
          var bar = entry.target.querySelector(".skill-bar-fill");
          if (bar) {
            var targetWidth = bar.style.width;
            bar.style.width = "0%";
            setTimeout(function () { bar.style.width = targetWidth; }, 80);
          }
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    faders.forEach(function (f) { appearOnScroll.observe(f); });
  } else {
    faders.forEach(function (f) { f.classList.add("visible"); });
  }

  // ─── Cursor Glow ─────────────────────────────────────────────────────────────
  var cursor = document.getElementById("cursor-glow");
  if (cursor) {
    document.addEventListener("mousemove", function (e) {
      cursor.style.transform = "translate(" + e.clientX + "px, " + e.clientY + "px)";
    });
  }

  // ─── Active Nav on Scroll ─────────────────────────────────────────────────────
  var navLinks    = document.querySelectorAll(".nav-link, .mobile-link");
  var sections    = document.querySelectorAll("section");
  var snapContainer = document.getElementById("snap-container");

  if (snapContainer) {
    snapContainer.addEventListener("scroll", function () {
      var current = "";
      sections.forEach(function (section) {
        if (snapContainer.scrollTop >= section.offsetTop - 160) {
          current = section.getAttribute("id");
        }
      });
      navLinks.forEach(function (link) {
        link.classList.remove("active");
        if (link.getAttribute("href") === "#" + current) {
          link.classList.add("active");
        }
      });
    });
  }

  // ─── Smooth Scroll ───────────────────────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var href = this.getAttribute("href");
      if (href === "#") return;
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        var mm = document.querySelector(".mobile-menu");
        var mt = document.querySelector(".mobile-toggle");
        if (mm) mm.classList.remove("open");
        if (mt) mt.textContent = "☰";
      }
    });
  });

  // ─── Theme Toggle ────────────────────────────────────────────────────────────
  var themeBtn = document.querySelector(".theme-toggle");
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-theme");
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      document.body.classList.toggle("light-theme");
      localStorage.setItem("theme", document.body.classList.contains("light-theme") ? "light" : "dark");
    });
  }

  // ─── Mobile Menu ─────────────────────────────────────────────────────────────
  var mobileToggle = document.querySelector(".mobile-toggle");
  var mobileMenu   = document.querySelector(".mobile-menu");
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener("click", function () {
      var isOpen = mobileMenu.classList.toggle("open");
      mobileToggle.textContent = isOpen ? "✕" : "☰";
    });
  }

  // ─── Three.js Particle Background ────────────────────────────────────────────
  var canvas = document.getElementById("three-canvas");
  if (canvas && typeof THREE !== "undefined") {
    try {
      var scene    = new THREE.Scene();
      var camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 100;

      var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      var particleCount = 120;
      var positions  = new Float32Array(particleCount * 3);
      var velocities = new Float32Array(particleCount * 3);

      for (var i = 0; i < particleCount; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 200;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
        velocities[i * 3]     = (Math.random() - 0.5) * 0.3;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      }

      var geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      var material = new THREE.PointsMaterial({ color: 0xa855f7, size: 1.2, transparent: true, opacity: 0.65 });
      var points   = new THREE.Points(geometry, material);
      scene.add(points);

      var animFrameId;
      function animate() {
        animFrameId = requestAnimationFrame(animate);
        var pos = geometry.attributes.position.array;
        for (var j = 0; j < particleCount; j++) {
          pos[j * 3]     += velocities[j * 3];
          pos[j * 3 + 1] += velocities[j * 3 + 1];
          pos[j * 3 + 2] += velocities[j * 3 + 2];
          if (pos[j * 3]     >  100 || pos[j * 3]     < -100) velocities[j * 3]     *= -1;
          if (pos[j * 3 + 1] >  100 || pos[j * 3 + 1] < -100) velocities[j * 3 + 1] *= -1;
          if (pos[j * 3 + 2] >  100 || pos[j * 3 + 2] < -100) velocities[j * 3 + 2] *= -1;
        }
        geometry.attributes.position.needsUpdate = true;
        points.rotation.y += 0.0005;
        renderer.render(scene, camera);
      }
      animate();

      window.addEventListener("resize", function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    } catch (e) {
      console.warn("WebGL background init error:", e);
    }
  }

  // ─── AI Chat Knowledge Base & Fallback ─────────────────────────────────────────
  var KB = {
    name:     "Pintu Mahato",
    title:    "Software Developer @ TRPGLOBAL",
    location: "Kolkata, West Bengal, India",
    email:    "mahatopintu63@gmail.com",
    phone:    "+91 89182 53874",
    linkedin: "https://www.linkedin.com/in/pintu-mahato-software-developer/",
    github:   "https://github.com/PintuM07",
    about:    "Pintu is a passionate Software Developer at TRPGLOBAL in Kolkata. He specializes in Java, Spring Boot, Oracle APEX, React, Next.js, and building robust backend and full-stack solutions.",
    skills:   ["Java", "Spring Boot", "React.js", "Next.js", "Node.js", "MySQL", "PostgreSQL", "REST APIs", "Hibernate", "JPA", "Oracle APEX", "SQL", "AWS", "Git", "CI/CD", "HTML", "CSS", "JavaScript", "JSP", "Ollama", "DeepSeek AI"],
    experience: [
      { role: "Analyst", company: "TRPGLOBAL", period: "May 2025 – Present", tech: "Oracle APEX, SQL, Software Infrastructure, Full-stack" },
      { role: "Internship Trainee", company: "Pankaj Sir Academy", period: "Jul 2023 – Feb 2024", tech: "Core Java, JSP, Spring Boot, REST APIs" },
      { role: "Process Technician", company: "Centum Electronics Ltd.", period: "Nov 2020 – May 2023", tech: "Electronics, Process Management" }
    ],
    education: [
      { inst: "Mallabhum Institute of Technology, WB", degree: "B.Tech – ECE", period: "Oct 2021 – Jun 2024", grade: "7.99 CGPA" },
      { inst: "Murarai Government Polytechnic", degree: "Diploma – ECE", period: "2017 – 2020", grade: "C Programming" }
    ],
    projects: [
      "TRPGLOBAL Website – Next.js, React.js, Tailwind CSS, TypeScript (Official corporate site)",
      "DeepSeek AI Integration – Java, Spring Boot, Ollama, REST APIs (Local LLM inference)",
      "Employee Management System – Java, Spring Boot, PostgreSQL, Hibernate",
      "Banking Application – Java, Spring Boot, MySQL, Spring Security, REST APIs",
      "Blog Application – Java, Spring Boot, JSP, MySQL, Spring Security",
      "Smart Contact Manager – Java, Spring Boot, Thymeleaf, MySQL, Spring Security",
      "Real-time Inventory Tracker – Java, Spring Boot, MySQL, REST APIs, AWS",
      "YouTube Video Downloader – Java, Spring Boot, YouTube API, REST APIs",
      "Weather App – HTML, CSS, JavaScript, Weather API (Live demo: pintum07.github.io/Weather-App/)",
      "Tic Tac Toe Game – Pure JavaScript, HTML, CSS (Interactive 2-player game)"
    ]
  };

  function buildReply(q) {
    var l = q.toLowerCase();
    if (/\b(hi|hello|hey|hola)\b/.test(l)) {
      return "Hi there! I'm Pintu's AI assistant. Ask me about his skills, experience, projects, or education!";
    }
    if (/skill|tech|stack|know|language|framework/.test(l)) {
      return "Pintu's tech stack includes: " + KB.skills.join(", ") + ".\n\nHis primary expertise is in Java, Spring Boot, React.js, Next.js, and Oracle APEX.";
    }
    if (/experience|work|job|career|history/.test(l)) {
      return "Pintu's experience:\n" + KB.experience.map(function (e) {
        return "• " + e.role + " @ " + e.company + " (" + e.period + ") — " + e.tech;
      }).join("\n");
    }
    if (/current|now|present|trpglobal/.test(l)) {
      return "Pintu currently works as an Analyst at TRPGLOBAL in Kolkata (May 2025 – Present), focusing on Oracle APEX, SQL, and software infrastructure.";
    }
    if (/education|degree|college|university|study|cgpa|gpa|grade/.test(l)) {
      return "Pintu's education:\n" + KB.education.map(function (e) {
        return "• " + e.inst + "\n  " + e.degree + " | " + e.period + " | " + e.grade;
      }).join("\n\n");
    }
    if (/project|built|build|portfolio|application/.test(l)) {
      return "Pintu's featured projects:\n" + KB.projects.map(function (p) { return "• " + p; }).join("\n");
    }
    if (/java|spring|hibernate|jpa/.test(l)) {
      return "Java & Spring Boot are Pintu's core expertise. He has built REST APIs, Hibernate/JPA data layers, and secured web services.";
    }
    if (/react|next|node|frontend/.test(l)) {
      return "Pintu works with React.js, Next.js, and Node.js for modern web development, including the official TRPGLOBAL Next.js website.";
    }
    if (/oracle|apex/.test(l)) {
      return "At TRPGLOBAL, Pintu works with Oracle Application Express (APEX) and SQL to develop scalable enterprise business applications.";
    }
    if (/ai|deepseek|ollama|llm/.test(l)) {
      return "Pintu created a DeepSeek AI integration using Ollama and Spring Boot, enabling local LLM inference via REST APIs.";
    }
    if (/aws|cloud|devops/.test(l)) {
      return "Pintu has experience deploying applications to AWS, configuring MySQL/PostgreSQL databases, and working with CI/CD pipelines.";
    }
    if (/contact|email|phone|reach|hire/.test(l)) {
      return "You can reach Pintu directly at:\nEmail: " + KB.email + "\nPhone: " + KB.phone + "\nLinkedIn: " + KB.linkedin + "\nGitHub: " + KB.github;
    }
    if (/location|where|city|kolkata/.test(l)) {
      return "Pintu is based in Kolkata, West Bengal, India. He is open to On-site, Hybrid, and Remote opportunities.";
    }
    if (/about|who|tell me/.test(l)) {
      return KB.about;
    }
    if (/linkedin/.test(l)) {
      return "LinkedIn: " + KB.linkedin;
    }
    if (/github/.test(l)) {
      return "GitHub: " + KB.github;
    }
    return "I can answer questions about Pintu's skills, experience, education, projects, or contact info. What would you like to know?";
  }

  // ─── AI Chat Interaction ─────────────────────────────────────────────────────
  var chatBtn    = document.getElementById("ai-chat-btn");
  var chatPanel  = document.getElementById("ai-chat-panel");
  var chatClose  = document.getElementById("ai-chat-close");
  var chatInput  = document.getElementById("ai-chat-input");
  var chatSend   = document.getElementById("ai-chat-send");
  var chatMsgs   = document.getElementById("ai-chat-messages");

  function toggleChat(force) {
    if (!chatPanel || !chatBtn) return;
    var isOpen = chatPanel.classList.contains("open");
    var shouldOpen = force !== undefined ? force : !isOpen;
    chatPanel.classList.toggle("open", shouldOpen);
    chatBtn.classList.toggle("open", shouldOpen);
    chatPanel.setAttribute("aria-hidden", !shouldOpen);
    if (shouldOpen && chatInput) chatInput.focus();
  }

  function addMsg(text, sender) {
    if (!chatMsgs) return;
    var div = document.createElement("div");
    div.className = "ai-msg " + sender;
    div.textContent = text;
    chatMsgs.appendChild(div);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
    return div;
  }

  function showTyping() {
    if (!chatMsgs) return null;
    var div = document.createElement("div");
    div.className = "ai-msg bot ai-typing";
    div.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatMsgs.appendChild(div);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
    return div;
  }

  async function handleSend() {
    if (!chatInput) return;
    var text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = "";
    addMsg(text, "user");
    var typing = showTyping();

    // Query RAG server first, gracefully fall back to local knowledge base
    var reply;
    try {
      var res = await fetch("http://localhost:8000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        var data = await res.json();
        reply = data.answer || buildReply(text);
      } else {
        reply = buildReply(text);
      }
    } catch (_) {
      reply = buildReply(text);
    }

    if (typing) typing.remove();
    addMsg(reply, "bot");
  }

  if (chatBtn)   chatBtn.addEventListener("click", function () { toggleChat(); });
  if (chatClose) chatClose.addEventListener("click", function () { toggleChat(false); });
  if (chatSend)  chatSend.addEventListener("click", handleSend);
  if (chatInput) {
    chatInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") handleSend();
    });
  }

  // ─── Project Filter ────────────────────────────────────────────────────────────
  var filterBtns   = document.querySelectorAll(".filter-btn");
  var projectCards = document.querySelectorAll(".project-card");

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var filter = btn.getAttribute("data-filter");

      filterBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      projectCards.forEach(function (card) {
        if (filter === "all" || card.getAttribute("data-category") === filter) {
          card.classList.remove("hidden");
          card.classList.remove("visible");
          setTimeout(function () { card.classList.add("visible"); }, 30);
        } else {
          card.classList.add("hidden");
        }
      });
    });
  });

})();
