(function () {
  const root = document.documentElement;
  const toggle = document.querySelector(".theme-toggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  const storageKey = "halalmapp.theme";

  function storedTheme() {
    try {
      return localStorage.getItem(storageKey);
    } catch (_) {
      return null;
    }
  }

  function applyTheme(theme, persist) {
    const dark = theme === "dark";
    root.dataset.theme = dark ? "dark" : "light";
    if (toggle) {
      toggle.setAttribute(
        "aria-label",
        dark ? "Switch to light mode" : "Switch to dark mode",
      );
    }
    if (themeMeta) {
      themeMeta.setAttribute("content", dark ? "#0A1628" : "#2F6B4F");
    }
    if (persist) {
      try {
        localStorage.setItem(storageKey, dark ? "dark" : "light");
      } catch (_) {
        /* Theme still applies when storage is unavailable. */
      }
    }
  }

  applyTheme(root.dataset.theme || (systemTheme.matches ? "dark" : "light"), false);

  if (toggle) {
    toggle.addEventListener("click", function () {
      applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
    });
  }

  systemTheme.addEventListener("change", function (event) {
    if (!storedTheme()) applyTheme(event.matches ? "dark" : "light", false);
  });
})();

(function () {
  const toggle = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".nav-mobile");
  if (!toggle || !mobileNav) return;

  toggle.addEventListener("click", function () {
    const open = mobileNav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  mobileNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mobileNav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
})();

// ─── Launch waitlist ───
(function () {
  const form = document.getElementById("waitlist-form");
  if (!form) return;

  const emailInput = document.getElementById("waitlist-email");
  const honeypot = document.getElementById("waitlist-company");
  const submit = document.getElementById("waitlist-submit");
  const status = document.getElementById("waitlist-status");
  const config = window.HALALMAPP_CONFIG || {};
  const endpoint = config.SUPABASE_URL
    ? config.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/waitlist_signups"
    : null;

  const STORAGE_KEY = "halalmapp.waitlist.email";

  function setStatus(message, state) {
    status.textContent = message;
    status.className = "waitlist-status" + (state ? " is-" + state : "");
  }

  function setBusy(busy) {
    submit.disabled = busy;
    emailInput.disabled = busy;
    submit.textContent = busy ? "Joining…" : "Notify me";
  }

  function looksLikeEmail(value) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
  }

  try {
    const remembered = localStorage.getItem(STORAGE_KEY);
    if (remembered) {
      setStatus("You’re on the list — we’ll email " + remembered + " at launch.", "success");
    }
  } catch (err) {
    /* private browsing: nothing to restore */
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (honeypot && honeypot.value) return;

    const email = emailInput.value.trim();
    if (!looksLikeEmail(email)) {
      setStatus("Enter a valid email address so we can reach you.", "error");
      emailInput.focus();
      return;
    }

    if (!endpoint || !config.SUPABASE_ANON_KEY) {
      setStatus("Signups aren’t configured yet. Email " + (config.CONTACT_EMAIL || "us") + " and we’ll add you.", "error");
      return;
    }

    setBusy(true);
    setStatus("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.SUPABASE_ANON_KEY,
          Authorization: "Bearer " + config.SUPABASE_ANON_KEY,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ email: email, source: "website" }),
      });

      // 409 means the unique index rejected a repeat address, which is a success
      // from the visitor's point of view.
      if (response.ok || response.status === 409) {
        const repeat = response.status === 409;
        setStatus(
          repeat
            ? "You’re already on the list — we’ll email you at launch."
            : "You’re in. We’ll email you the day HalalMapp launches.",
          "success",
        );
        form.reset();
        try {
          localStorage.setItem(STORAGE_KEY, email);
        } catch (err) {
          /* storage unavailable; the message above is enough */
        }
        return;
      }

      throw new Error("Signup failed with status " + response.status);
    } catch (err) {
      setStatus(
        "Something went wrong. Try again, or email " + (config.CONTACT_EMAIL || "us") + ".",
        "error",
      );
    } finally {
      setBusy(false);
    }
  });
})();

// ─── Founding restaurant interest form ───
(function () {
  const form = document.getElementById("partner-form");
  if (!form) return;

  const restaurantInput = document.getElementById("partner-restaurant");
  const restaurantIdInput = document.getElementById("partner-restaurant-id");
  const locationInput = document.getElementById("partner-location");
  const suggest = document.getElementById("partner-suggest");
  const matchNote = document.getElementById("partner-match");
  const honeypot = document.getElementById("partner-company");
  const submit = document.getElementById("partner-submit");
  const status = document.getElementById("partner-status");
  const success = document.getElementById("partner-success");
  const config = window.HALALMAPP_CONFIG || {};
  const base = config.SUPABASE_URL ? config.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/rpc/" : null;
  let searchTimer = null;

  function rpcHeaders() {
    return {
      "Content-Type": "application/json",
      apikey: config.SUPABASE_ANON_KEY,
      Authorization: "Bearer " + config.SUPABASE_ANON_KEY,
    };
  }

  function setStatus(message, state) {
    status.textContent = message;
    status.className = "waitlist-status" + (state ? " is-" + state : "");
  }

  function looksLikeEmail(value) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
  }

  function hideSuggest() {
    suggest.hidden = true;
    suggest.innerHTML = "";
  }

  function setMatch(row) {
    restaurantIdInput.value = row.id;
    restaurantInput.value = row.name;
    if (row.city || row.address) {
      locationInput.value = [row.address, row.city].filter(Boolean).join(", ");
    }
    matchNote.hidden = false;
    matchNote.textContent = "Matched to an existing HalalMapp listing.";
    hideSuggest();
  }

  restaurantInput.addEventListener("input", function () {
    restaurantIdInput.value = "";
    matchNote.hidden = true;
    const q = restaurantInput.value.trim();
    clearTimeout(searchTimer);
    if (!base || !config.SUPABASE_ANON_KEY || q.length < 2) {
      hideSuggest();
      return;
    }
    searchTimer = setTimeout(async function () {
      try {
        const response = await fetch(base + "search_partner_listings", {
          method: "POST",
          headers: rpcHeaders(),
          body: JSON.stringify({ p_query: q }),
        });
        if (!response.ok) {
          hideSuggest();
          return;
        }
        const rows = await response.json();
        if (!Array.isArray(rows) || !rows.length) {
          hideSuggest();
          return;
        }
        suggest.innerHTML = "";
        rows.forEach(function (row) {
          const item = document.createElement("li");
          const button = document.createElement("button");
          button.type = "button";
          button.innerHTML =
            "<strong></strong><small></small>";
          button.querySelector("strong").textContent = row.name;
          button.querySelector("small").textContent = [row.address, row.city].filter(Boolean).join(", ");
          button.addEventListener("click", function () {
            setMatch(row);
          });
          item.appendChild(button);
          suggest.appendChild(item);
        });
        suggest.hidden = false;
      } catch (_) {
        hideSuggest();
      }
    }, 220);
  });

  document.addEventListener("click", function (event) {
    if (!suggest.contains(event.target) && event.target !== restaurantInput) hideSuggest();
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (honeypot && honeypot.value) return;

    const restaurantName = restaurantInput.value.trim();
    const contactName = document.getElementById("partner-contact").value.trim();
    const email = document.getElementById("partner-email").value.trim();
    const location = locationInput.value.trim();

    if (restaurantName.length < 2) {
      setStatus("Enter your restaurant name.", "error");
      restaurantInput.focus();
      return;
    }
    if (contactName.length < 2) {
      setStatus("Enter your name so we know who to contact.", "error");
      return;
    }
    if (!looksLikeEmail(email)) {
      setStatus("Enter a valid email address.", "error");
      return;
    }
    if (location.length < 2) {
      setStatus("Add a city or street address in the GTA.", "error");
      locationInput.focus();
      return;
    }
    if (!base || !config.SUPABASE_ANON_KEY) {
      setStatus("Signups aren’t configured yet. Email " + (config.CONTACT_EMAIL || "us") + ".", "error");
      return;
    }

    submit.disabled = true;
    submit.textContent = "Submitting…";
    setStatus("");

    try {
      const restaurantId = restaurantIdInput.value || null;
      const response = await fetch(base + "submit_partner_interest", {
        method: "POST",
        headers: rpcHeaders(),
        body: JSON.stringify({
          p_restaurant_name: restaurantName,
          p_contact_name: contactName,
          p_email: email,
          p_phone: document.getElementById("partner-phone").value.trim() || null,
          p_website_or_instagram: document.getElementById("partner-link").value.trim() || null,
          p_location: location,
          p_restaurant_id: restaurantId,
          p_note: document.getElementById("partner-note").value.trim() || null,
          p_company: honeypot ? honeypot.value : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Signup failed with status " + response.status);
      }

      form.hidden = true;
      success.hidden = false;
    } catch (err) {
      setStatus(
        "Something went wrong. Try again, or email " + (config.CONTACT_EMAIL || "us") + ".",
        "error",
      );
    } finally {
      submit.disabled = false;
      submit.textContent = "Join the Founding Restaurant Program";
    }
  });
})();
