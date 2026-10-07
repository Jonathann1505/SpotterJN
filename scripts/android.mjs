import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const command = process.argv[2];
const args = process.argv.slice(3);
const localJdkDirectory = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, 'Programs', 'SpotterJN', 'Temurin21')
  : undefined;
const jdkCandidates = [
  process.env.SPOTTER_ANDROID_JDK,
  process.env.JAVA_HOME,
  process.env.ANDROID_STUDIO_JDK,
  ...(localJdkDirectory ? findLocalJdks(localJdkDirectory) : []),
].filter((candidate) => typeof candidate === 'string' && candidate.length > 0);

if (!['open', 'run'].includes(command)) {
  console.error('Usage: node scripts/android.mjs <open|run> [Capacitor options]');
  process.exit(2);
}

const javaHome = jdkCandidates.find(isSupportedJdk);

if (!javaHome) {
  console.error(
    'Android Gradle needs Java 17-23. Install JDK 21, set SPOTTER_ANDROID_JDK to its folder, and select it as Android Studio\'s Gradle JDK.',
  );
  process.exit(1);
}

const androidSdk = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk')
    : undefined,
].find((candidate) => candidate && existsSync(candidate));

if (!androidSdk) {
  console.error(
    'Android SDK not found. Install it from Android Studio SDK Manager or set ANDROID_HOME.',
  );
  process.exit(1);
}

const cliPath = path.join(projectRoot, 'node_modules', '@capacitor', 'cli', 'bin', 'capacitor');
const pathSeparator = path.delimiter;
const env = {
  ...process.env,
  ANDROID_HOME: androidSdk,
  ANDROID_SDK_ROOT: androidSdk,
  JAVA_HOME: javaHome,
  PATH: [
    path.join(javaHome, 'bin'),
    path.join(androidSdk, 'platform-tools'),
    process.env.PATH ?? '',
  ].join(pathSeparator),
};
const runArgs = command === 'run' ? addAndroidTarget(args, env) : args;
const result =
  runArgs === undefined
    ? { status: 1 }
    : spawnSync(process.execPath, [cliPath, command, 'android', ...runArgs], {
        cwd: projectRoot,
        env,
        stdio: 'inherit',
      });

if (result.error) {
  console.error(`Could not start Capacitor: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);

function addAndroidTarget(capacitorArgs, processEnv) {
  if (capacitorArgs.includes('--target')) {
    return capacitorArgs;
  }

  const adbPath = path.join(
    processEnv.ANDROID_HOME,
    'platform-tools',
    process.platform === 'win32' ? 'adb.exe' : 'adb',
  );
  const adb = spawnSync(adbPath, ['devices'], {
    encoding: 'utf8',
    env: processEnv,
  });

  if (adb.error || adb.status !== 0) {
    console.error('Could not find Android Debug Bridge. Install Android SDK Platform Tools.');
    return undefined;
  }

  const availableTargets = (adb.stdout ?? '')
    .split(/\r?\n/)
    .map((line) => line.match(/^(\S+)\s+device(?:\s|$)/)?.[1])
    .filter((target) => target !== undefined);
  const requestedTarget = process.env.SPOTTER_ANDROID_DEVICE;

  if (requestedTarget) {
    if (!availableTargets.includes(requestedTarget)) {
      console.error(
        `Android device "${requestedTarget}" is not connected. Check its ADB serial with "adb devices".`,
      );
      return undefined;
    }

    return [...capacitorArgs, '--target', requestedTarget];
  }

  const target =
    availableTargets.find((device) => device.startsWith('emulator-')) ??
    availableTargets[0];

  if (!target) {
    console.error(
      'No Android device found. Start an emulator in Android Studio Device Manager or connect a device with USB debugging.',
    );
    return undefined;
  }

  return [...capacitorArgs, '--target', target];
}

function findLocalJdks(parentDirectory) {
  if (!existsSync(parentDirectory)) {
    return [];
  }

  return readdirSync(parentDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('jdk-'))
    .map((entry) => path.join(parentDirectory, entry.name));
}

function isSupportedJdk(javaHomeCandidate) {
  const javaBinary = path.join(
    javaHomeCandidate,
    'bin',
    process.platform === 'win32' ? 'java.exe' : 'java',
  );

  if (!existsSync(javaBinary)) {
    return false;
  }

  const result = spawnSync(javaBinary, ['-version'], { encoding: 'utf8' });
  const versionOutput = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const majorVersion = versionOutput.match(/version "(?:1\.)?(\d+)/i)?.[1];

  return (
    result.status === 0 &&
    majorVersion !== undefined &&
    Number(majorVersion) >= 17 &&
    Number(majorVersion) <= 23
  );
}
