document.addEventListener('DOMContentLoaded', function () {
  // Convert every section H2 into a collapsible button and wrap remaining section content
  document.querySelectorAll('section').forEach(section => {
    const h2 = section.querySelector('h2');
    if (!h2) return;
    const btn = document.createElement('button');
    btn.className = 'collapsible';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = h2.innerHTML;
    h2.replaceWith(btn);

    const content = document.createElement('div');
    content.className = 'collapsible-content';

    // Move all other children of the section into content
    while (btn.nextSibling) {
      content.appendChild(btn.nextSibling);
    }
    section.appendChild(content);

    // collapsed by default
    content.style.maxHeight = null;

    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      if (!expanded) {
        // open
        content.style.maxHeight = content.scrollHeight + 'px';
        // allow transition to settle then clear maxHeight to follow content changes
        setTimeout(() => { if (btn.getAttribute('aria-expanded') === 'true') content.style.maxHeight = content.scrollHeight + 'px'; }, 300);
      } else {
        // close
        content.style.maxHeight = null;
      }
    });
  });

  // Auto-crop and auto-adjust profile photo using canvas (client-side)
  function autoAdjustProfileImage(img) {
    if (!img || img.dataset.processed === '1') return;
    // wait until image loaded
    if (!img.complete) {
      img.addEventListener('load', () => autoAdjustProfileImage(img));
      return;
    }

    try {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const size = Math.min(iw, ih);
      const sx = Math.floor((iw - size) / 2);
      const sy = Math.floor((ih - size) / 2);
      const outSize = 600;

      const canvas = document.createElement('canvas');
      canvas.width = outSize;
      canvas.height = outSize;
      const ctx = canvas.getContext('2d');
      // draw cropped centered square to canvas
      ctx.drawImage(img, sx, sy, size, size, 0, 0, outSize, outSize);

      const imageData = ctx.getImageData(0, 0, outSize, outSize);
      const data = imageData.data;

      // compute per-channel min/max
      let rmin=255,gmin=255,bmin=255, rmax=0,gmax=0,bmax=0;
      for (let i=0;i<data.length;i+=4){
        const r=data[i], g=data[i+1], b=data[i+2];
        if (r<rmin) rmin=r; if (g<gmin) gmin=g; if (b<bmin) bmin=b;
        if (r>rmax) rmax=r; if (g>gmax) gmax=g; if (b>bmax) bmax=b;
      }

      // stretch each channel to use full range
      const rScale = rmax>rmin ? 255/(rmax-rmin) : 1;
      const gScale = gmax>gmin ? 255/(gmax-gmin) : 1;
      const bScale = bmax>bmin ? 255/(bmax-bmin) : 1;

      for (let i=0;i<data.length;i+=4){
        data[i] = Math.max(0, Math.min(255, Math.round((data[i]-rmin)*rScale)));
        data[i+1] = Math.max(0, Math.min(255, Math.round((data[i+1]-gmin)*gScale)));
        data[i+2] = Math.max(0, Math.min(255, Math.round((data[i+2]-bmin)*bScale)));
        // slight gamma correction to lift midtones
        data[i] = Math.pow(data[i]/255, 0.95)*255;
        data[i+1] = Math.pow(data[i+1]/255, 0.95)*255;
        data[i+2] = Math.pow(data[i+2]/255, 0.95)*255;
      }

      ctx.putImageData(imageData, 0, 0);

      // optional: apply slight unsharp mask via canvas filter (if supported)
      // produce data URL and set as img src
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      img.src = dataUrl;
      img.dataset.processed = '1';
    } catch (e) {
      console.error('autoAdjustProfileImage failed', e);
    }
  }

  const profileImg = document.querySelector('.photo-wrap img');
  if (profileImg) autoAdjustProfileImage(profileImg);
});
