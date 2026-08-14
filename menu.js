// The only JavaScript on the site. It flips state and nothing else — every
// transition, transform, and layout change lives in styles.css.

const toggle = document.querySelector('.nav-toggle');
const panel = document.querySelector('.nav-panel');

const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('nav-open', open);
}

toggle.addEventListener('click', () => setOpen(!isOpen()));

// Every link is a same-page anchor, so close the drawer to reveal the target.
panel.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
    }
});
