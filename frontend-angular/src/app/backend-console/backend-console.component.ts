import { Component, OnInit } from '@angular/core';
import {ApiConnection, CONNECTION_STATUS} from "../util/Api/ApiConnection";
import {toastInfo} from "../util/Log";
import {delay} from "q";

@Component({
  selector: 'app-backend-console',
  templateUrl: './backend-console.component.html',
  styleUrls: ['./backend-console.components.css'],
})
export class BackendConsoleComponent implements OnInit {

  log: {direction: string, message: any}[] = [];
  sendText: string;
  connected: CONNECTION_STATUS = CONNECTION_STATUS.NOT_CONNECTED;
  CONNECTION_STATUS = CONNECTION_STATUS;


  constructor() {
    ApiConnection.onReceive.subscribe(data => {
      this.log.push({direction: 'got', message: data});
    });
    ApiConnection.onSend.subscribe(data => {
      this.log.push({direction: 'send', message: data});
    });

    // get status updates
    ApiConnection.connectionStatus.subscribe(status => this.connected = status);
  }

  ngOnInit() {
  }

  onSendButton() {
    /*
    ApiConnection.send(this.sendText);
    toastInfo(this.sendText);*/
  }
}