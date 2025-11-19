const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({canvas: document.getElementById("bg"), antialias:true, alpha:true});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);

let orbs = [];

// Sky
const skyGeo = new THREE.SphereGeometry(500, 32, 32);
const skyMat = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float intensity;
    void main() {
      vec3 calm = vec3(0.05,0.05,0.15);
      vec3 storm = vec3(0.4,0.1,0.6);
      gl_FragColor = vec4(mix(calm, storm, intensity),1.0);
    }
  `,
  uniforms: { intensity: {value:0} },
  side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

async function load(lat, lon, name) {
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=snowfall_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`);
  const data = await res.json();

  const days = data.daily.time.map((t,i)=>({
    date:t,
    snow: data.daily.snowfall_sum[i]||0,
    prob: data.daily.precipitation_probability_max[i]||0
  }));

  const willSnow = days.some(d=>d.snow>0.5);
  const maxSnow = Math.max(...days.map(d=>d.snow));

  // Sky mood
  gsap.to(skyMat.uniforms.intensity, {value: willSnow?0.9:0.1, duration:4});

  // Location
  document.getElementById("location").textContent = name.toUpperCase();
  gsap.to("#location",{opacity:1, y:0, duration:2, ease:"power3.out"});

  // YES / NO
  const answer = document.getElementById("answer");
  answer.textContent = willSnow?"YES":"NO";
  answer.style.background = willSnow ? "linear-gradient(135deg,#ff006e,#833ab4)" : "linear-gradient(135deg,#667eea,#764ba2)";
  answer.style.webkitBackgroundClip = "text";
  gsap.fromTo(answer,{opacity:0, scale:0.5},{opacity:1, scale:1, duration:1.8, ease:"elastic.out(1,0.5)", delay:0.5});
  if(willSnow) document.getElementById("sound").play();

  // Orbs
  orbs.forEach(o=>scene.remove(o.mesh));
  orbs = [];
  days.forEach((day,i)=>{
    const geo = new THREE.SphereGeometry(0.6, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: day.snow>0.5 ? 0xff2e63 : 0x667eea,
      transparent:true,
      opacity:0.8
    });
    const mesh = new THREE.Mesh(geo, mat);
    const angle = (i/7)*Math.PI*2;
    mesh.position.set(Math.cos(angle)*4, Math.sin(i*0.5)*1.5-2, Math.sin(angle)*4);
    scene.add(mesh);
    orbs.push({mesh, day});
  });

  // Products
  const html = `
    <a href="https://amzn.to/3WvJ2kL" target="_blank" class="card"><img src="https://m.media-amazon.com/images/I/81yZ1rXjVPL._AC_SL1500_.jpg"></a>
    <a href="https://amzn.to/3iYkP9m" target="_blank" class="card"><img src="https://m.media-amazon.com/images/I/81fVvL3eHsL._AC_SL1500_.jpg"></a>
    <a href="https://amzn.to/3XmKp1R" target="_blank" class="card"><img src="https://m.media-amazon.com/images/I/81p1F3qZc9L._AC_SL1500_.jpg"></a>
  `;
  document.getElementById("products").innerHTML = html;
  gsap.to("#products",{opacity:1, y:0, duration:2, delay:1});
}

// Animate
function animate() {
  requestAnimationFrame(animate);
  orbs.forEach((o,i)=>{
    o.mesh.rotation.y += 0.005;
    const targetY = Math.sin(Date.now()*0.001 + i)*0.3;
    o.mesh.position.y += (targetY - o.mesh.position.y)*0.05;
  });
  renderer.render(scene, camera);
}
animate();

// Init with IP
fetch("https://ipwho.is/").then(r=>r.json()).then(ip=>{
  load(ip.latitude, ip.longitude, `${ip.city}, ${ip.country}`);
});

// Search
document.getElementById("search").addEventListener("keypress", e=>{
  if(e.key==="Enter"){
    const q = e.target.value;
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1`)
      .then(r=>r.json())
      .then(d=> {
        if(d.results?.[0]) {
          const r = d.results[0];
          load(r.latitude, r.longitude, `${r.name}, ${r.country}`);
          e.target.value="";
        }
      });
  }
});

// Share
document.getElementById("share").onclick = ()=> {
  navigator.clipboard.writeText(location.href);
  alert("Link copied — send it to someone who needs to know");
};