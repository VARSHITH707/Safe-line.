import { useMemo, useRef } from 'react';
import { useFrame }        from '@react-three/fiber';
import * as THREE          from 'three';

/**
 * GlowingPath
 *
 * Renders one neon navigation route in 3D world space.
 *
 * Props:
 *  - color     {string}   hex color
 *  - waypoints {Array}    [[x,y,z], ...]
 *  - active    {boolean}  true = full brightness (selected route)
 *                         false = dimmed (alternative routes)
 *
 * When active=true:
 *   Full emissive glow, 10 flowing particles, breathing animation,
 *   destination beacon + ground ring.
 *
 * When active=false:
 *   Static tube at low opacity, 4 slow particles, no beacon, no breathing.
 *   Used to show alternative routes without distracting from the primary.
 */

const PARTICLE_COUNT_ACTIVE  = 10;
const PARTICLE_COUNT_DIMMED  = 4;

const DEFAULT_WAYPOINTS = [
  [0, -0.5, 0], [0, -0.5, -2], [0, -0.5, -4],
  [0, -0.5, -6], [-2, -0.5, -6], [-6, -0.5, -6],
];

const _particlePos = new THREE.Vector3(); // pre-allocated

export default function GlowingPath({
  color      = '#39ff14',
  waypoints: waypointsProp = null,
  active     = true,
}) {
  const rawPoints    = waypointsProp || DEFAULT_WAYPOINTS;
  const particleCount = active ? PARTICLE_COUNT_ACTIVE : PARTICLE_COUNT_DIMMED;

  const waypoints = useMemo(
    () => rawPoints.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(rawPoints)]
  );

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(waypoints, false, 'catmullrom', 0.5),
    [waypoints]
  );

  const { innerGeom, outerGeom } = useMemo(() => ({
    innerGeom: new THREE.TubeGeometry(curve, 120, active ? 0.03 : 0.018, 8, false),
    outerGeom:  new THREE.TubeGeometry(curve, 120, active ? 0.12 : 0.06,  8, false),
  }), [curve, active]);

  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  const destPos    = useMemo(() => waypoints[waypoints.length - 1], [waypoints]);
  const markerPositions = useMemo(() => waypoints.slice(1, -1), [waypoints]);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const innerMatRef  = useRef();
  const startRingRef = useRef();
  const beaconRef    = useRef();
  const particleRefs = useRef([]);

  // ── Animation ─────────────────────────────────────────────────────────────
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (active) {
      // Full breathing on active route
      if (innerMatRef.current) {
        innerMatRef.current.emissiveIntensity = 3.0 + Math.sin(t * 1.8) * 1.5;
      }
      if (startRingRef.current?.material) {
        startRingRef.current.material.emissiveIntensity = 4.0 + Math.sin(t * 2.4 + 1.0) * 2.0;
      }
      // Beacon pulse
      if (beaconRef.current) {
        const pulse = 1.0 + Math.sin(t * 2.8) * 0.30;
        beaconRef.current.scale.setScalar(pulse);
        if (beaconRef.current.material) {
          beaconRef.current.material.emissiveIntensity = 6.0 + Math.sin(t * 3.5) * 4.0;
        }
      }
    }

    // Flowing particles — slower and fewer when dimmed
    const speed = active ? 0.16 : 0.06;
    particleRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const phase = ((t * speed) + (i / particleCount)) % 1.0;
      curve.getPoint(phase, _particlePos);
      mesh.position.copy(_particlePos);
      if (active) {
        const scale = 0.4 + 0.5 * Math.abs(Math.sin(t * 4.5 + i * 0.85));
        mesh.scale.setScalar(scale);
        if (mesh.material) mesh.material.emissiveIntensity = 5.0 + Math.sin(t * 5.0 + i) * 3.0;
      }
    });
  });

  return (
    <group>
      {/* Inner tube */}
      <mesh geometry={innerGeom} renderOrder={2}>
        <meshStandardMaterial
          ref={innerMatRef}
          color={threeColor}
          emissive={threeColor}
          emissiveIntensity={active ? 3 : 0.8}
          transparent={!active}
          opacity={active ? 1 : 0.5}
          toneMapped={false}
        />
      </mesh>

      {/* Outer halo */}
      <mesh geometry={outerGeom} renderOrder={1}>
        <meshBasicMaterial
          color={threeColor}
          transparent
          opacity={active ? 0.15 : 0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Waypoint orbs — only on active route */}
      {active && markerPositions.map((pt, i) => (
        <mesh key={`orb-${i}`} position={pt} renderOrder={3}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color={threeColor} emissive={threeColor} emissiveIntensity={5} toneMapped={false} />
        </mesh>
      ))}

      {/* Flowing particles */}
      {Array.from({ length: particleCount }).map((_, i) => (
        <mesh key={`p-${i}`} ref={(el) => { particleRefs.current[i] = el; }} renderOrder={4}>
          <sphereGeometry args={[active ? 0.032 : 0.018, 6, 6]} />
          <meshStandardMaterial
            color={threeColor}
            emissive={threeColor}
            emissiveIntensity={active ? 6 : 2}
            transparent
            opacity={active ? 0.9 : 0.4}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Start ring */}
      <mesh ref={startRingRef} position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.015, 8, 48]} />
        <meshStandardMaterial
          color={threeColor}
          emissive={threeColor}
          emissiveIntensity={active ? 4 : 1}
          transparent={!active}
          opacity={active ? 1 : 0.4}
          toneMapped={false}
        />
      </mesh>

      {/* Destination beacon — ONLY on active route, always bright green */}
      {active && (
        <group position={destPos}>
          <mesh ref={beaconRef} renderOrder={5}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#00ff44" emissive="#00ff44" emissiveIntensity={6} toneMapped={false} />
          </mesh>
          <mesh renderOrder={4}>
            <sphereGeometry args={[0.30, 16, 16]} />
            <meshBasicMaterial color="#00ff44" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
            <torusGeometry args={[0.45, 0.02, 8, 48]} />
            <meshBasicMaterial color="#00ff44" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* Small dimmed-route destination dot (no green beacon, just a faint color dot) */}
      {!active && (
        <mesh position={destPos} renderOrder={3}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={threeColor} emissive={threeColor} emissiveIntensity={2} transparent opacity={0.5} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
