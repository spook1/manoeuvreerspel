import { ApiClient } from '../core/ApiClient';
import '../style.css'; // Reuse main styles for font etc.

// Check query params specifically
const params = new URLSearchParams(window.location.search);
const isRegister = params.get('mode') === 'register';
const returnTarget = params.get('return');
const returnQuery = returnTarget ? `&return=${encodeURIComponent(returnTarget)}` : '';
const loginHref = returnTarget ? `login.html?return=${encodeURIComponent(returnTarget)}` : 'login.html';
const registerHref = `login.html?mode=register${returnQuery}`;
const successHref = returnTarget === 'harbor-save' ? 'index.html?resume=harbor-save' : 'index.html';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="login-container">
    <div class="login-box">
      <h1>${isRegister ? 'Registreren' : 'Inloggen'}</h1>
      
      <form id="auth-form">
        ${isRegister ? `
          <div class="form-group">
            <label>Naam</label>
            <input type="text" id="name" required placeholder="Jouw naam">
          </div>
        ` : ''}

        <div class="form-group">
          <label>Email</label>
          <input type="email" id="email" required placeholder="naam@voorbeeld.nl">
        </div>

        <div class="form-group">
          <label>Wachtwoord</label>
          <input type="password" id="password" required placeholder="Wachtwoord">
        </div>

        <button type="submit" class="btn-primary">
          ${isRegister ? 'Registreren' : 'Inloggen'}
        </button>
      </form>

      <div class="links">
        ${isRegister
        ? `<p>Al een account? <a href="${loginHref}">Log hier in</a></p>`
        : `<p>Nog geen account? <a href="${registerHref}">Registreer hier</a></p>`
    }
        <p><a href="index.html">Terug naar het spel (Gast)</a></p>
      </div>
      
      <div id="error-msg" class="error"></div>
    </div>
  </div>
`;

// Handle Submit
const form = document.getElementById('auth-form') as HTMLFormElement;
const errorMsg = document.getElementById('error-msg') as HTMLDivElement;

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.innerText = '';

    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    try {
        if (isRegister) {
            const name = (document.getElementById('name') as HTMLInputElement).value;
            await ApiClient.register(name, email, password);
        } else {
            await ApiClient.login(email, password);
        }

        // Success! Redirect to game
        window.location.href = successHref;
    } catch (err: any) {
        console.error(err);
        errorMsg.innerText = 'Fout: ' + (err.message || 'Onbekende fout');
    }
});
