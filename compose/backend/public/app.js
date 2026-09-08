const form = document.querySelector("#registration-form");
const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const message = document.querySelector("#message");
const registrations = document.querySelector("#registrations");
const refreshButton = document.querySelector("#refresh");

function showMessage(text, error = false) {
  message.textContent = text;
  message.className = `message${error ? " error" : ""}`;
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

async function loadRegistrations() {
  registrations.innerHTML = '<p class="empty">Loading...</p>';

  try {
    const response = await fetch("/api/registrations");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    if (!data.length) {
      registrations.innerHTML = '<p class="empty">No registrations yet.</p>';
      return;
    }

    registrations.innerHTML = data.map(item => `
      <article class="registration">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.email)}</span>
          <small>${formatDate(item.registeredAt)}</small>
        </div>
        <button class="secondary delete" data-id="${item._id}" type="button">Delete</button>
      </article>
    `).join("");

    document.querySelectorAll(".delete").forEach(button => {
      button.addEventListener("click", () => deleteRegistration(button.dataset.id));
    });
  } catch (error) {
    registrations.innerHTML = '<p class="empty">Could not load registrations.</p>';
    showMessage(error.message, true);
  }
}

async function register(event) {
  event.preventDefault();

  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    password: passwordInput.value
  };

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not register.");
    }

    form.reset();
    showMessage("Registration saved to MongoDB.");
    await loadRegistrations();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function deleteRegistration(id) {
  try {
    const response = await fetch(`/api/registrations/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Could not delete registration.");
    }

    showMessage("Registration deleted.");
    await loadRegistrations();
  } catch (error) {
    showMessage(error.message, true);
  }
}

form.addEventListener("submit", register);
refreshButton.addEventListener("click", loadRegistrations);
loadRegistrations();
