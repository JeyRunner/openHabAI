import {ApiObject} from "../ApiObject";
import { Chart, ChartData, Point } from 'chart.js';
import {Component, EventEmitter, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Subject} from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";
import {componentDestroyed} from "ng2-rx-componentdestroyed";
import "rxjs/add/operator/delayWhen";

@Component({
  selector: 'chart-range',
  templateUrl: './chart-range.component.html',
  styles: [`
      table tr {
          border-bottom: 2px solid #dcdcdc;
      }
  `]
})
export class ApiChart implements OnInit, OnDestroy
{
  @ViewChild("chartElement") chartElement;  // chart canvas
  public chart: Chart = null;               // chart.js object
  private chartDirty: boolean = true;
  private chartGotFirstData: boolean = false;

  /* store input values
   * index = id  */
  protected inputValues: any = {};

  private object: ApiObject<any> = null;
  @Input() inputs: {id: number, name: string}[] = [];
  @Input() outputs: {id: number, name: string}[] = [];

  // subscriptions
  private objectUnsubscribe: Subject<void> = new Subject<void>();

  constructor() {
  }


  /**
   * set appObject object for communicating with the chart object in the backend
   * @param {ApiObject<any>} obj
   */
  @Input()  public set apiObject(obj: ApiObject<any>) {
    // cleanup old object
    this.objectUnsubscribe.next();
    this.objectUnsubscribe.complete();
    if (this.object != null)
      this.object.unsubscribe();

    // set object
    if (obj == undefined) {
      console.error("can't set undefined object for chart, you have to set object prop");
      return;
    }
    this.object = obj;

    // update self
    if (this.chart != null && this.chartDirty)
      this.refreshObject();
    else if (!this.chartDirty)
      this.chartDirty = true; // set object later after this.chart is initialised

    console.info("set obj", obj);
  }

  public get apiObject(): ApiObject<any> {
    return this.object;
  }

  /**
   * send changed chart input/output params to backend
   */
  onInputsChanged() {
    /* generate fixed/range Inputs lists  */
    let fixedInputs = [];
    let rangeInputs = [];

    for (let id in this.inputValues)
    {
      if (!this.inputValues.hasOwnProperty(id))
        continue;

      if (this.inputValues[id].boundTo == '')
        fixedInputs.push({id: Number(id), value: this.inputValues[id].valueFixed, tolerance: this.inputValues[id].valueFixedTolerance});
      else
        rangeInputs.push({id: Number(id), ...this.inputValues[id].valueRange});
    }

    // update object
    this.object.update({
      fixedInputs: fixedInputs,
      rangeInputs: rangeInputs,
      outputs: this.outputs.map(output => output.id)
    });
  }


  private refreshObject() {
    console.info('\n\n refreshObject -------- ' + this.object.route);

    // update chart on data change
    this.object.onAction()
      .takeUntil(componentDestroyed(this))
      .subscribe(value =>
      {
        if (value.action == 'updateData') {

        // test data
        let outList = value.data[0];
        if (outList == undefined) {
          this.chart.data.datasets[0].data = [];
          this.chart.update();
          return;
        }

        //console.log('chart DATA update: ' + this.object.route, outList);

        let boundToXId = Object.keys(this.inputValues).filter((id, index) => this.inputValues[id].boundTo == 'x')[0];
        if (boundToXId == undefined) {
          this.chart.data.datasets[outList[0]].data = [];
        }
        else {
          this.chart.data.datasets[outList[0]].data = outList[1].reduce((dataPoints, point) => dataPoints.concat({
            x: this.round( point.inputs[boundToXId] [1] ),
            y: this.round( point.value )
          }), []);
        }

        // add:        this.chartLearnRate.data.datasets[1].data = this.chartLearnRate.data.datasets[1].data.concat({x: this.a++, y: this.a*this.a});
        this.chart.update();

      }
    });

    // set inputs/outputs when object props change
    this.object.objectChanged()
      .takeUntil(componentDestroyed(this))
      .subscribe((changed) => {
        if (changed == null)
          return;

        let obj = changed.object;
        console.info('chart changed: ', changed.changedKeys);

        // update input/output names
        if (changed.changedKeys.includes('inputNames') || changed.changedKeys.includes('outputNames')) {
          this.inputs = obj.inputNames.map((inp) => {
            return {id: inp[0], name: inp[1]};
          });
          this.outputs = obj.outputNames.map((inp) => {
            return {id: inp[0], name: inp[1]};
          });

          // generate outputs
          this.chart.data.datasets = [];
          for (let output of this.outputs) {
            this.chart.data.datasets.push({
              data: [],
              label: output.name,
              backgroundColor: "#3e95cd",
              borderColor: "#3e95cd",
              fill: false
            });
          }
          this.chart.update();
        }

        // generate inputs
        // fixed
        if (changed.changedKeys.includes('fixedInputs'))
          for (let input of obj.fixedInputs) {
            this.inputValues[input.id] = {
              id: input.id,
              boundTo: '',
              valueFixed: input.value,
              valueFixedTolerance: input.tolerance,
              valueRange: {
                from: -5,
                to: 5,
                steps: 10,
              }
            }
          }
        // range
        if (changed.changedKeys.includes('rangeInputs'))
          for (let input of obj.rangeInputs) {
            this.inputValues[input.id] = {
              id: input.id,
              boundTo: 'x',
              valueFixed: 0,
              valueFixedTolerance: 0.1,
              valueRange: {
                from: input.from,
                to: input.to,
                steps: input.steps,
              }
            }
          }
        // if id not in range/fixed inputs
        for (let input of obj.inputNames) {
          if (!(input[0] in this.inputValues))
            this.inputValues[input[0]] = new ChartInput();
        }

        // request initial data
        if (!this.chartGotFirstData) {
          this.onInputsChanged();
          this.chartGotFirstData = true;
        }
      });

    // get data updates
    this.object.subscribe();
  }


  /**
   * setup gui stuff: link chart.js to html canvas
   */
  ngOnInit(): void {
    // setup chart.js chart
    this.chart = new Chart(( <HTMLCanvasElement> this.chartElement.nativeElement).getContext("2d"), {
      type: 'line',
      data: {
        datasets: [ /*{
          data: [],
          label: "Network",
          backgroundColor: "#3e95cd",
          borderColor: "#3e95cd",
          fill: false
        }, {
          data: [],
          label: "Real",
          backgroundColor: "#97e400",
          borderColor: "#97e400",
          fill: false
        } */
        ]
      },
      options: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            usePointStyle: false
          }

        },
        scales: {
          xAxes: [{
            type: 'linear',
            position: 'bottom'
          }],
          yAxes: [{
            type: 'linear',
            position: 'left'
          }]
        }
      }
    });

    // if need update
    if (this.chartDirty)
      this.refreshObject();
  }

  /**
   * cleanup
   */
  ngOnDestroy(): void {
    this.chart.destroy();
    this.object.unsubscribe();
    this.objectUnsubscribe.next();
    this.objectUnsubscribe.complete();
  }


  round(num: number): number {
    return Math.round(num * 100000) / 100000
  }

}

/** ChartInput
 */
class ChartInput {
  id: number = 0;
  boundTo = "";
  valueFixed: number = 0;
  valueFixedTolerance: number = 0.1;
  valueRange = {
    from: -5,
    to: 5,
    steps: 10,
  };
}