import DodecahedronVertices from "./DodecahedronVertices.js";
import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  PointLight,
  Clock,
  Vector2,
} from "three";

import { createNoise3D } from "simplex-noise";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

class App {
  #resizeCallback = () => this.#onResize();

  constructor(container, opts = { debug: false }) {
    this.container = document.querySelector(container);
    this.points = [];
    this.lines = [];
    this.dodecahedronObject = null;
    this.screen = new Vector2(
      this.container.clientWidth,
      this.container.clientHeight,
    );

    this.hasDebug = opts.debug;
  }

  async init() {
    this.#createScene();
    this.#createCamera();
    this.#createRenderer();

    this.#createLight();
    this.#createClock();
    this.#addListeners();
    this.#createControls();

    this.dodecahedronVertices = new DodecahedronVertices(
      this.scene,
      this.camera,
      {
        size: 1,
        vertexColor: 0xffffff,
        vertexSize: 0.05,
      },
    );
    if (this.hasDebug) {
      const { Debug } = await import("./Debug.js");
      new Debug(this);

      const { default: Stats } = await import("stats.js");
      this.stats = new Stats();
      document.body.appendChild(this.stats.dom);
    }

    this.renderer.setAnimationLoop(() => {
      this.stats?.begin();

      this.#update();
      this.#render();

      this.stats?.end();
    });
  }

  destroy() {
    this.renderer.dispose();
    this.#removeListeners();
  }

  #update() {
    const elapsed = this.clock.getElapsedTime();
    this.dodecahedronVertices.tick(elapsed);
    this.simulation?.update();
  }

  #render() {
    this.renderer.render(this.scene, this.camera);
  }

  #createScene() {
    this.scene = new Scene();
  }

  #createCamera() {
    this.camera = new PerspectiveCamera(
      75,
      this.screen.x / this.screen.y,
      0.1,
      100,
    );
    this.camera.position.set(0, 0, 3);
  }

  #createRenderer() {
    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
    });

    this.container.appendChild(this.renderer.domElement);

    this.renderer.setSize(this.screen.x, this.screen.y);
    this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
    this.renderer.setClearColor(0xffffff);
    this.renderer.physicallyCorrectLights = true;
  }

  #createLight() {
    this.pointLight = new PointLight(0xff0055, 500, 100, 2);
    this.pointLight.position.set(0, 10, 13);
    this.scene.add(this.pointLight);
  }

  #createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  #createClock() {
    this.clock = new Clock();
  }

  #addListeners() {
    window.addEventListener("resize", this.#resizeCallback, { passive: true });
  }

  #removeListeners() {
    window.removeEventListener("resize", this.#resizeCallback, {
      passive: true,
    });
  }

  #onResize() {
    this.screen.set(this.container.clientWidth, this.container.clientHeight);

    this.camera.aspect = this.screen.x / this.screen.y;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.screen.x, this.screen.y);
  }
}

window._APP_ = new App("#app", {
  debug: window.location.hash.includes("debug"),
});

window._APP_.init();
