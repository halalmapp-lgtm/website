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
