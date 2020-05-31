## Getting Started

- [React Native](https://reactnative.dev/)
- [WebRTC](https://webrtc.org/)

### Installing

- clone repository

```
  https://github.com/chnirt/react-native-webrtc.git
```

- cd into directory

```
  cd react-native-webrtc/
```

- install dependencies

```
  npm i
```

- start ios or android

```
  npm run ios
  npm run android
```

### Configuration for Android

IF NOT ALREADY ===>

- Under dependencies in android/build.gradle

```
replace : classpath("com.android.tools.build:gradle:3.5.2") by : classpath("com.android.tools.build:gradle:3.6.2")
```
- In android/gradle.properties

```
add this line : android.enableDexingArtifactTransform.desugaring=false
```
- In android/settings.gradle

````
add these two line :
include ':WebRTCModule', ':app'
project(':WebRTCModule').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-webrtc/android')
```

- Under dependencies in android.app/build.gradle

```
add this line :
compile project(':WebRTCModule')
```

- In android/app/src/main/AndroidManifest.xml

```
Add these permissions :
   <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" />
    <uses-feature android:name="android.hardware.camera.autofocus"/>

    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

- In android/app/src/main/java/com/reactnativewebrtc/MainApplication.java

```
Add this import :
import com.oney.WebRTCModule.WebRTCModulePackage;
```

- In android/gradle/wrapper/gradle-wrapper.properties

```
replace distributionUrl by this one
distributionUrl=https\://services.gradle.org/distributions/gradle-5.6.4-all.zip
```






