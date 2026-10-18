
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SareeCanvasHero } from './SareeCanvasHero';

const webGLConfig = vi.hoisted(() => ({
  shouldFail: false,
}));

vi.mock('three', () => {
  class Scene {
    add = vi.fn();
  }

  class PerspectiveCamera {
    position = {
      x: 0,
      y: 0,
      z: 0,
      set: vi.fn((x: number, y: number, z: number) => {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
      }),
    };

    aspect = 1;
    updateProjectionMatrix = vi.fn();
    lookAt = vi.fn();
  }

  class WebGLRenderer {
    domElement = document.createElement('canvas');
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
    toneMapping = 0;
    toneMappingExposure = 1;

    constructor() {
      if (webGLConfig.shouldFail) {
        throw new Error('WebGL is unavailable');
      }
    }
  }

  class Light {
    position = { set: vi.fn() };

    constructor(..._args: unknown[]) {}
  }

  class Group {
    add = vi.fn();
  }

  class Texture {
    wrapS = 0;
    wrapT = 0;
    repeat = { set: vi.fn() };
  }

  class CanvasTexture extends Texture {
    constructor(_canvas: HTMLCanvasElement) {
      super();
    }
  }

  class PlaneGeometry {
    attributes: {
      position: {
        count: number;
        needsUpdate: boolean;
        getX: (index: number) => number;
        getY: (index: number) => number;
        getZ: (index: number) => number;
        setXYZ: (index: number, x: number, y: number, z: number) => void;
      };
    };

    computeVertexNormals = vi.fn();

    constructor(
      _width: number,
      _height: number,
      _segmentsX: number,
      _segmentsY: number,
    ) {
      const points = [
        { x: -1, y: -0.5, z: 0 },
        { x: 0, y: 0.5, z: 0 },
        { x: 1, y: -0.5, z: 0 },
      ];

      this.attributes = {
        position: {
          count: points.length,
          needsUpdate: false,
          getX: (i) => points[i].x,
          getY: (i) => points[i].y,
          getZ: (i) => points[i].z,
          setXYZ: (i, x, y, z) => {
            points[i] = { x, y, z };
          },
        },
      };
    }
  }

  class MeshStandardMaterial {
    constructor(_options: unknown) {}
  }

  class Mesh {
    userData: Record<string, unknown> = {};

    constructor(
      public geometry: PlaneGeometry,
      public material: MeshStandardMaterial,
    ) {}
  }

  class BufferGeometry {
    attributes: Record<string, any> = {};

    setAttribute = vi.fn((name: string, attribute: BufferAttribute) => {
      this.attributes[name] = attribute;
    });
  }

  class BufferAttribute {
    needsUpdate = false;

    constructor(
      public array: Float32Array,
      public itemSize: number,
    ) {}
  }

  class PointsMaterial {
    constructor(_options: unknown) {}
  }

  class Points {
    constructor(
      public geometry: BufferGeometry,
      public material: PointsMaterial,
    ) {}
  }

  class Clock {
    getElapsedTime = vi.fn(() => 1);
  }

  return {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    AmbientLight: Light,
    DirectionalLight: Light,
    PointLight: Light,
    Group,
    Texture,
    CanvasTexture,
    PlaneGeometry,
    MeshStandardMaterial,
    Mesh,
    BufferGeometry,
    BufferAttribute,
    PointsMaterial,
    Points,
    Clock,
    ACESFilmicToneMapping: 1,
    RepeatWrapping: 2,
    ClampToEdgeWrapping: 3,
    DoubleSide: 4,
    AdditiveBlending: 5,
  };
});

describe('SareeCanvasHero', () => {
  const onExploreClick = vi.fn();
  const onSelectCategory = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    webGLConfig.shouldFail = false;

    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 123),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    vi.spyOn(
      HTMLCanvasElement.prototype,
      'getContext',
    ).mockImplementation((contextId: string) => {
      if (contextId !== '2d') return null;

      return {
        fillStyle: '',
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        fill: vi.fn(),
        arc: vi.fn(),
        quadraticCurveTo: vi.fn(),
      } as unknown as CanvasRenderingContext2D;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function renderHero() {
    return render(
      <SareeCanvasHero
        onExploreClick={onExploreClick}
        onSelectCategory={onSelectCategory}
      />,
    );
  }

  it('renders the brand heading and textiles subtitle', () => {
    renderHero();

    expect(
      screen.getByRole('heading', { name: 'SRI BHAGYALAKSHMI' }),
    ).toBeInTheDocument();

    expect(screen.getByText('TEXTILES')).toBeInTheDocument();
  });

  it('renders the Explore, All Sarees, and scroll controls', () => {
    renderHero();

    expect(screen.getByRole('button', { name: /Explore/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /All Sarees/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Scroll to collection' }),
    ).toBeInTheDocument();
  });

  it('calls onExploreClick when Explore is clicked', () => {
    renderHero();

    fireEvent.click(screen.getByRole('button', { name: /Explore/i }));

    expect(onExploreClick).toHaveBeenCalledTimes(1);
  });

  it('calls onExploreClick when the scroll control is clicked', () => {
    renderHero();

    fireEvent.click(
      screen.getByRole('button', { name: 'Scroll to collection' }),
    );

    expect(onExploreClick).toHaveBeenCalledTimes(1);
  });

  it('calls onSelectCategory with undefined when All Sarees is clicked', () => {
    renderHero();

    fireEvent.click(screen.getByRole('button', { name: /All Sarees/i }));

    expect(onSelectCategory).toHaveBeenCalledTimes(1);
    expect(onSelectCategory).toHaveBeenCalledWith(undefined);
  });

  it('initializes the 3D canvas when WebGL setup succeeds', () => {
    const { container } = renderHero();

    expect(container.querySelector('canvas')).toBeInTheDocument();
    expect(
      container.querySelector('section'),
    ).toBeInTheDocument();
  });

  it('registers mouse and resize listeners and removes them on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHero();

    expect(addSpy).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function),
    );
    expect(addSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function),
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function),
    );
    expect(removeSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function),
    );
    expect(cancelAnimationFrame).toHaveBeenCalledWith(123);
  });

  it('handles window resize events', () => {
    renderHero();

    fireEvent(window, new Event('resize'));

    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles mouse movement events', () => {
    renderHero();

    fireEvent.mouseMove(window, {
      clientX: 200,
      clientY: 150,
    });

    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('shows the fallback background when WebGL initialization fails', () => {
    webGLConfig.shouldFail = true;

    const { container } = renderHero();

    expect(container.querySelector('canvas')).not.toBeInTheDocument();
    expect(
      container.querySelector('.bg-gradient-to-br'),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'SRI BHAGYALAKSHMI' }),
    ).toBeInTheDocument();
  });
});
