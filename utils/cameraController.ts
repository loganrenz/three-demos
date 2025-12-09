import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export class CameraController {
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls | null = null
  private isIntroPlaying: boolean = true
  private introStartTime: number = 0
  private introDuration: number = 8
  private keyPositions: THREE.Vector3[] = []
  private keyTargets: THREE.Vector3[] = []

  constructor(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.camera = camera
    this.setupIntroPath()
    this.introStartTime = performance.now() / 1000
  }

  private setupIntroPath(): void {
    // Define key positions for cinematic flythrough
    this.keyPositions = [
      new THREE.Vector3(0, 80, 80), // High above, looking down
      new THREE.Vector3(40, 50, 40), // Moving closer
      new THREE.Vector3(60, 30, 0), // Side view
      new THREE.Vector3(0, 25, 60), // Front view, closer
      new THREE.Vector3(-50, 35, -30) // Angled view
    ]

    this.keyTargets = [
      new THREE.Vector3(0, 0, 0), // Center of city
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]
  }

  public setupControls(renderer: THREE.WebGLRenderer): void {
    this.controls = new OrbitControls(this.camera, renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 20
    this.controls.maxDistance = 150
    this.controls.maxPolarAngle = Math.PI / 2.1 // Prevent going underground
    this.controls.enabled = false // Disabled during intro
  }

  public update(time: number): void {
    if (this.isIntroPlaying) {
      const elapsed = time - this.introStartTime
      const progress = Math.min(1, elapsed / this.introDuration)

      if (progress >= 1) {
        this.isIntroPlaying = false
        if (this.controls) {
          this.controls.enabled = true
        }
        return
      }

      // Smooth interpolation between key positions
      const segmentCount = this.keyPositions.length - 1
      const segmentProgress = progress * segmentCount
      const segmentIndex = Math.floor(segmentProgress)
      const segmentT = segmentProgress - segmentIndex

      if (segmentIndex < this.keyPositions.length - 1) {
        const startPos = this.keyPositions[segmentIndex]
        const endPos = this.keyPositions[segmentIndex + 1]
        const startTarget = this.keyTargets[segmentIndex]
        const endTarget = this.keyTargets[segmentIndex + 1]

        // Easing function
        const easedT = segmentT * segmentT * (3 - 2 * segmentT)

        this.camera.position.lerpVectors(startPos, endPos, easedT)
        const target = new THREE.Vector3().lerpVectors(startTarget, endTarget, easedT)
        this.camera.lookAt(target)
      }
    } else if (this.controls) {
      this.controls.update()
    }
  }

  public replayIntro(): void {
    this.isIntroPlaying = true
    this.introStartTime = performance.now() / 1000
    if (this.controls) {
      this.controls.enabled = false
    }
  }

  public get isPlayingIntro(): boolean {
    return this.isIntroPlaying
  }
}

