import {$} from 'protractor';
import {MaterializeAction, MaterializeDirective, MaterializeModule} from "angular2-materialize";

declare var Materialize: any;


export function toast(msg, time) {
  if (time != undefined) {
    Materialize.toast(msg, time);
  } else {
    Materialize.toast(msg, 1500);
  }
}


export function toastOk(msg: string) {
  Materialize.toast('<i class="material-icons left circle green">done</i>' + msg, 1500);
}

export function toastInfo(msg: string, obj: Object = null) {
  if (obj == null)
    Materialize.toast('<i class="material-icons left circle blue">info_outline</i>' + msg, 1500);
  else
    Materialize.toast(`<i class="material-icons left circle blue">info_outline</i><div> ${msg}` + `<pre><ngx-prism [language] = "'json'"> ${JSON.stringify(obj, null, 2)} </ngx-prism></pre></div>`, 5000);
}

export function toastErr(msg: string) {
  Materialize.toast('<i class="material-icons left circle red">error_outline</i>' + msg, 2000);
}
