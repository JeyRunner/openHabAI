
// -- socket ------------------------------------------------------------
import {toastErr, toast, toastInfo, toastOk} from "../Log";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {$} from "protractor";
import {EventEmitter} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {ApiRoute} from "./Utils";

export class ApiConnection {

  private static sock: WebSocket;
  private static respondCounter: number;
  private static respondCallbacks: any[] = [];
  private static sendQueue: {route, what: string, callback, data} [] = [];

  static onReceive = new ReplaySubject<any>();
  static onSend: ReplaySubject<any> = new ReplaySubject<any>();
  static onReady: EventEmitter<undefined> = new EventEmitter();
  static connectionStatus: ReplaySubject<CONNECTION_STATUS> = new ReplaySubject<CONNECTION_STATUS>();

  static connect() {
    // -- connection ------------------------------------------------------------
    this.sock = new WebSocket('ws://localhost:5555');
    this.sock.onerror = (error) => {
      toastErr("can't connect to server");
      this.connectionStatus.next(CONNECTION_STATUS.NOT_CONNECTED);
    };

    this.sock.onopen = (p1) => {
      toastOk("connected with server");
      this.onReady.emit();
      this.connectionStatus.next(CONNECTION_STATUS.CONNECTED);

      // send all in queue
      this.progressQueue()
    };

    // message id
    this.respondCounter = 0;
    this.respondCallbacks.length = 0;

    this.sock.onmessage =  (event) => {
      //console.log(event.data);
      var data = JSON.parse(event.data);

      this.onReceive.next(JSON.stringify(data, null, 2));

      switch (data.type) {
        case "respond":
          if (data.what == "error") {
            //toastErr("<p>" + data.data.message + "</p><br> <pre>" + Prism.highlight(JSON.stringify(data.data.request, null, 2), Prism.languages.json) + "</pre>");
            toastErr("<p>" + data.data.message + "</p><br>");
            return;
          }
          if (this.respondCallbacks[data.respondId] != undefined) {
            if (data.data !== undefined)
              this.respondCallbacks[data.respondId](data.what, data.data);
            else
              this.respondCallbacks[data.respondId](data.what);
            delete this.respondCallbacks[data.respondId];
          }
          break;

        case "request":
          toastErr("progress request not implemented yet");
          break;

        default:
          toastErr("got unknown message type '" + data.type + "'");
      }
    }

  }

  static sendRequest(route: ApiRoute, what: string, callback, data = null) {
    this.sendQueue.push({route, what, callback, data});
    this.progressQueue();
  }

  static sendNonWait(data: string) {
    if (this.sock.readyState == this.sock.CLOSED || this.sock.readyState == this.sock.CONNECTING)
      return;

    this.onSend.next(data);
    this.sock.send(data);
  }

  private static progressQueue() {
    if (this.sock == undefined)
      return;
    if (this.sock.readyState == this.sock.OPEN) {
      while (this.sendQueue.length > 0) {
        let msg = this.sendQueue.pop();
        this.sendRequestNonWait(msg.route, msg.what, msg.callback, msg.data)
      }
    }
  }

  private static sendRequestNonWait(route, what: string, callback, data = null) {
    if (this.sock.readyState == this.sock.CLOSED || this.sock.readyState == this.sock.CONNECTING)
      return;

    var dataS = {
      "type": "request",
      "route": route,
      "what": what,
      "data": "",
      "respondId": -1
    };

    if ((data != null))
      dataS.data = data;

    if (callback !== undefined && callback !== null) {
      // want respond
      dataS.respondId = this.respondCounter;
      this.respondCallbacks[this.respondCounter] = callback;
      this.respondCounter++;
    }

    this.onSend.next(JSON.stringify(dataS, null, 2));
    this.sock.send(JSON.stringify(dataS));
  };
}

export enum CONNECTION_STATUS {
  CONNECTED,
  NOT_CONNECTED
}


