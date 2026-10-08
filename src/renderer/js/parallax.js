/**
 * GlassWave Mouse Parallax Controller
 * Restrained micro-parallax for 3D glass spatial depth
 * Avoids motion sickness with spring damping and subtle amplitude limits
 */

class MouseParallax {
  constructor(deckElementId, albumWrapId) {
    this.deck = document.getElementById(deckElementId);
    this.album = document.getElementById(albumWrapId);
    this.customBgImage = document.getElementById('custom-bg-image');
    this.enabled = true;

    this.targetX = 0;
    this.targetY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.lerpSpeed = 0.08;

    this.customBgFocalX = 0;
    this.customBgFocalY = 0;

    this.initEvents();
    this.startLoop();
  }

  updateCustomBgRef() {
    this.customBgImage = document.getElementById('custom-bg-image');
  }

  setEnabled(val) {
    this.enabled = !!val;
    if (!this.enabled) {
      this.targetX = 0;
      this.targetY = 0;
      this.currentX = this.currentY = 0;
      if (this.customBgImage) {
        this.customBgImage.style.setProperty('--mini-parallax-x', '0px');
        this.customBgImage.style.setProperty('--mini-parallax-y', '0px');
        const rot = this.customBgRotation || 0;
        const scale = this.customBgScale || 1.04;
        const focalX = this.customBgFocalX || 0;
        const focalY = this.customBgFocalY || 0;
        this.customBgImage.style.transform = `translate3d(${focalX}px, ${focalY}px, 0) scale(${scale}) rotate(${rot}deg)`;
      }
    }
  }

  initEvents() {
    window.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Normalized between -1 and 1
      this.targetX = Math.max(-1, Math.min(1, ((e.clientX / Math.max(1, w)) - 0.5) * 2));
      this.targetY = Math.max(-1, Math.min(1, ((e.clientY / Math.max(1, h)) - 0.5) * 2));
    });

    window.addEventListener('mouseleave', () => {
      this.targetX = 0;
      this.targetY = 0;
    });
  }

  startLoop() {
    const loop = () => {
      const mini = document.body.classList.contains('mini-bar-mode');
      if(document.body.classList.contains('direct-interaction')) {requestAnimationFrame(loop);return;}
      this.currentX += (this.targetX - this.currentX) * this.lerpSpeed;
      this.currentY += (this.targetY - this.currentY) * this.lerpSpeed;

      if (this.album && !mini) {
        // Subtle tilt & translation
        const rotX = -this.currentY * 4.5;
        const rotY = this.currentX * 4.5;
        const transX = this.currentX * 10;
        const transY = this.currentY * 10;
        this.album.style.transform = `perspective(800px) translate3d(${transX}px, ${transY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      }

      if (this.customBgImage) {
        // Spatial depth parallax in distance (opposite subtle motion to create authentic glass layering)
        const bgTransX = -this.currentX * (mini ? 8 : 18);
        const bgTransY = -this.currentY * (mini ? 3 : 18);
        const rot = this.customBgRotation || 0;
        const scale = this.customBgScale || 1.04;
        const focalX = this.customBgFocalX || 0;
        const focalY = this.customBgFocalY || 0;

        const totalX = Number((focalX + bgTransX).toFixed(2));
        const totalY = Number((focalY + bgTransY).toFixed(2));

        this.customBgImage.style.setProperty('--mini-parallax-x', mini ? bgTransX.toFixed(2) + 'px' : '0px');
        this.customBgImage.style.setProperty('--mini-parallax-y', mini ? bgTransY.toFixed(2) + 'px' : '0px');
        if (!mini) this.customBgImage.style.transform = `translate3d(${totalX}px, ${totalY}px, 0) scale(${scale}) rotate(${rot}deg)`;
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

window.MouseParallax = MouseParallax;
