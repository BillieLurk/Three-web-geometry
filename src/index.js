import DodecahedronVertices from "./DodecahedronVertices.js";
import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  BoxGeometry,
  MeshStandardMaterial,
  Mesh,
  PointLight,
  Clock,
  Vector2,
  PlaneGeometry,
  MeshBasicMaterial,
  DodecahedronGeometry,
} from "three";

import { createNoise3D } from "simplex-noise";

import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { SampleShaderMaterial } from "./materials/SampleShaderMaterial/index.js";
import { gltfLoader } from "./loaders/index.js";

const noise3D = createNoise3D();


class App {
  #resizeCallback = () => this.#onResize();

  constructor(container, opts = { physics: false, debug: false }) {
    this.container = document.querySelector(container);
    this.points = [];
    this.lines = [];
    this.dodecahedronObject = null;
    this.screen = new Vector2(
      this.container.clientWidth,
      this.container.clientHeight
    );

    this.hasPhysics = opts.physics;
    this.hasDebug = opts.debug;
  }

  async init() {
    this.#createScene();
    this.#createCamera();
    this.#createRenderer();

    if (this.hasPhysics) {
      const { Simulation } = await import("./physics/Simulation.js");
      this.simulation = new Simulation(this);

      const { PhysicsBox } = await import("./physics/Box.js");
      const { PhysicsFloor } = await import("./physics/Floor.js");

      Object.assign(this, { PhysicsBox, PhysicsFloor });
    }

    this.#createLight();
    this.#createFloor();
    this.#createClock();
    this.#addListeners();
    this.#createControls();

    this.dodecahedronVertices = new DodecahedronVertices(this.scene, this.camera, {
      size: 1,
      vertexColor: 0xffffff,
      vertexSize: 0.05,
    });
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
      100
    );
    this.camera.position.set(0, 0, 3);
  }

  #createRenderer() {
    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: window.devicePixelRatio === 1,
    });

    this.container.appendChild(this.renderer.domElement);

    this.renderer.setSize(this.screen.x, this.screen.y);
    this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
    this.renderer.setClearColor(0x000000);
    this.renderer.physicallyCorrectLights = true;
  }

  #createLight() {
    this.pointLight = new PointLight(0xff0055, 500, 100, 2);
    this.pointLight.position.set(0, 10, 13);
    this.scene.add(this.pointLight);
  }

  #createFloor() {
    if (!this.hasPhysics) return;

    const geometry = new PlaneGeometry(20, 20, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x424242 });

    this.floor = new Mesh(geometry, material);
    this.floor.rotateX(-Math.PI * 0.5);
    this.floor.position.set(0, -2, 0);

    this.scene.add(this.floor);

    const body = new this.PhysicsFloor(this.floor, this.scene);
    this.simulation.addItem(body);
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
  physics: window.location.hash.includes("physics"),
  debug: window.location.hash.includes("debug"),
});

window._APP_.init();
