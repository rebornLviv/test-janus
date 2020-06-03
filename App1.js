/* eslint-disable prettier/prettier */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Fragment, Component} from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Alert,
  Button,
  StyleSheet,
  View,
  Text,
} from 'react-native';

import {Janus} from './janus';

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
} from 'react-native-webrtc';

import {Dimensions} from 'react-native';

// also support setRemoteDescription, createAnswer, addIceCandidate, onnegotiationneeded, oniceconnectionstatechange, onsignalingstatechange, onaddstream

const dimensions = Dimensions.get('window');

let host = '192.168.30.162';
let server = 'http://' + host + ':8088/janus';
const wsServer = 'http://video.redentu.com:8088/janus';
// let backHost = 'http://' + host + ':3000/stream';

let started = false
let globalJsep = null;

let janus = null;
let sfu = null;
let opaqueId = 'sfutest-' + Janus.randomString(12);

let bitrateTimer = null;
let spinner = null;

let audioenabled = false;
let videoenabled = false;

let yourusername = null
let streamerName = 'Adrien';
let roomId = null;

Janus.init({
  debug: 'all',
  callback: function() {
    if (started) return;
    started = true;
  },
});

export default class JanusReactNative extends Component {
  constructor(props) {
    super(props);
    this.state = {
      info: 'Initializing',
      status: 'init',
      roomID: '',
      isFront: true,
      selfViewSrc: null,
      selfViewSrcKey: null,
      publish: false,
      // speaker: false,
      // audioMute: false,
      // videoMute: false,
      visible: false,
      jsep: {},
    };
    this.janusStart.bind(this);
    // this.toEnd.bind(this);
  }

  componentDidMount() {
    this.janusStart();
  }

  janusStart() {
    this.setState({visible: true});
    janus = new Janus({
      server: wsServer,
      // iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
      success: () => {
        janus.attach({
          plugin: 'janus.plugin.videoroom',
          opaqueId: opaqueId,
          success: pluginHandle => {
            sfu = pluginHandle;
            Janus.log(
              'Plugin attached! (' +
                sfu.getPlugin() +
                ', id=' +
                sfu.getId() +
                ')',
            );
          },
          error: error => {
            Janus.error('  -- Error attaching plugin...', error);
            Alert.alert('  -- Error attaching plugin...', error);
          },
          consentDialog: on => {
            Janus.debug(
              'Consent dialog should be ' + (on ? 'on' : 'off') + ' now',
            );
          },
          mediaState: (medium, on) => {
            Janus.log(
              'Janus ' +
                (on ? 'started' : 'stopped') +
                ' receiving our ' +
                medium,
            );
          },
          webrtcState: on => {
            Janus.log(
              'Janus says our WebRTC PeerConnection is ' +
                (on ? 'up' : 'down') +
                ' now',
            );
          },
          onmessage: (msg, jsep) => {
            console.log(
              '🌶🌶🌶🌶🌶🌶🌶🌶🌶🌶🌶🌶🌶🌶🌶🌶🌶',
              msg,
              '🌶🌶🌶🌶🌶🌶🌶🌶🌶🌶🌶🌶🌶🌶🌶🌶🌶',
              jsep
            )

            const event = msg['videoroom']
            if (event != undefined && event != null) {
              if (event === 'joined') {
                console.log('MESSAGE JOINED', msg)
                let myid = msg['id']
                sfu.createOffer({
                  media: { data: true }, // ... let's negotiate data channels as well
                  success: function (jsep) {
                    console.log('KIRIKOUUUUUUUUUUUU');
                    Janus.debug('Got SDP!');
                    Janus.debug(jsep);
                    // var body = { request: 'call', username: 'hung' };
                    // sfu.send({ message: body, jsep: jsep });
                    const publish = { 'request': 'publish', 'audio': true, 'video': true }
                    sfu.send({ 'message': publish, 'jsep': jsep })
                  },
                  error: function (error) {
                    Janus.error('WebRTC error...', error);
                    Alert.alert('WebRTC error... ' + error);
                  },
                });
                if (msg['publishers'] !== undefined && msg['publishers'] !== null) {
                  const list = msg['publishers']
                  for (const f in list) {
                    const id = list[f]['id']
                    const display = list[f]['display']
                    this.newRemoteFeed(id, display)
                  }
                }
              } else if (event === 'destroyed') {
                console.log('destroying')
              }
            }
          },
          onlocalstream: stream => {
            console.log('🏓🏓🏓🏓🏓🏓🏓🏓🏓🏓🏓🏓🏓🏓🏓🏓', stream.toURL());
            Janus.debug(' ::: Got a local stream :::');
            Janus.debug(stream);

            this.setState({
              selfViewSrc: stream.toURL(),
              selfViewSrcKey: Math.floor(Math.random() * 1000) + 1,
              status: 'ready',
            });
          },
          onremotestream: stream => {
            console.log('🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩', stream.toURL());
            Janus.debug(' ::: Got a remote stream :::');
            Janus.debug(stream);

            this.setState({
              remoteViewSrc: stream.toURL(),
              remoteViewSrcKey: Math.floor(Math.random() * 1000) + 2,
              status: 'connecting',
            });
          },
          ondataopen: function(data) {
            Janus.log('The DataChannel is available!');
          },
          ondata: function(data) {
            Janus.debug('We got data from the DataChannel! ' + data);
          },
          oncleanup: function() {
            Janus.log(' ::: Got a cleanup notification :::');
            yourusername = null;
          },
        });
      },
      error: error => {
        Janus.error('  Janus Error', error);
        Alert.alert('  Janus Error', error);
      },
      destroyed: () => {
        Alert.alert('  Success for End Call ');
        this.setState({publish: false});
      },
    });
  }

  startStreaming() {

    const joinRoom = roomId => {
      sfu.send({
        message: {
          request: 'joinandconfigure',
          ptype: 'publisher',
          room: roomId,
          audio: true,
          video: true
        },
        success: (x) => {
          console.log('callback from joinROom', x)
        },
        error: error => {
          Janus.error('Cannot join room');
        }
      })
    }

    sfu.send({
      message: { request: 'create' },
      success: roomInfo => {
        console.log('ROOM INFO', roomInfo);
        roomId = roomInfo.room;
        joinRoom(roomId)
      },
      error: error => {
        Janus.error('Cannot create room');
      },
    });

  }

  // doAccept() {
  //   console.log('✅✅✅✅✅✅✅✅✅✅✅✅ accept answer');

  //   sfu.createAnswer({
  //     jsep: globalJsep,
  //     media: {data: true},
  //     simulcast: false,
  //     success: function(jsep) {
  //       Janus.debug('Got SDP!');
  //       Janus.debug(jsep);
  //       let body = {
  //         request: 'accept',
  //       };
  //       sfu.send({
  //         message: body,
  //         jsep: jsep,
  //       });
  //     },
  //     error: function(error) {
  //       Janus.error('WebRTC error:', error);
  //     },
  //   });
  // }

  switchVideoType() {
    sfu.changeLocalCamera();
  }

  // toggleAudioMute = () => {
  //   let muted = sfu.isAudioMuted();
  //   if (muted) {
  //     sfu.unmuteAudio();
  //     this.setState({audioMute: false});
  //   } else {
  //     sfu.muteAudio();
  //     this.setState({audioMute: true});
  //   }
  // };

  // toggleVideoMute = () => {
  //   let muted = sfu.isVideoMuted();
  //   if (muted) {
  //     this.setState({videoMute: false});
  //     sfu.unmuteVideo();
  //   } else {
  //     this.setState({videoMute: true});
  //     sfu.muteVideo();
  //   }
  // };

  // toggleSpeaker = () => {
  //   if (this.state.speaker) {
  //     this.setState({speaker: false});
  //   } else {
  //     this.setState({speaker: true});
  //   }
  // };

  stopStreaming() {
    const hangup = {request: 'hangup'};
    sfu.send({message: hangup});
    sfu.hangup();
    yourusername = null;
    this.setState({selfViewSrc: null, remoteViewSrc: null, status: 'hangup'});
  };

  render(){
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text>{this.state.status}</Text>
        <TouchableOpacity onPress={this.startStreaming} underlayColor="white">
          <View style={styles.button}>
            <Text style={styles.buttonText}>Start Streaming</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => this.stopStreaming()} underlayColor="white">
          <View style={styles.button}>
            <Text style={styles.buttonText}>End streaming</Text>
          </View>
        </TouchableOpacity>
        <Button title="go screens" onPress={ ()=>{
          this.props.navigation.navigate('Video')
        }} />
        <TouchableOpacity onPress={this.switchVideoType} underlayColor="white">
          <View style={styles.button}>
            <Text style={styles.buttonText}>Switch camera</Text>
          </View>
        </TouchableOpacity>

        {this.state.selfViewSrc && (
          <RTCView
            key={this.state.selfViewSrcKey}
            streamURL={this.state.selfViewSrc}
            style={{width: 350, height: 600}}
          />
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 50
  },
  button: {
    marginBottom: 10,
    width: 260,
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 50
  },
  buttonText: {
    padding: 20,
    color: 'white',
  },
});
