import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DelibService } from '../delib.service';
import { AgentService } from '../agent.service';
import { AddComponent } from './add/add.component';
import { SortComponent } from './sort/sort.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss']
})
export class PageComponent  implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private agentService: AgentService,
    public delibService: DelibService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    let encodedServer = this.route.snapshot.paramMap.get('server');
    let server = decodeURIComponent(encodedServer ? encodedServer : '');
    let agent = this.route.snapshot.paramMap.get('agent');
    if(!agent) {agent = '';}
    let contract = this.route.snapshot.paramMap.get('contract');
    if(!contract) {contract = '';}
    this.delibService.setScope(server, agent, contract);
    this.delibService.sid = this.route.snapshot.queryParamMap.get('sid')
    this.delibService.getPage();
    this.agentService.listen(server, agent, contract).addEventListener('message', message => {
      if(message.data) {
        this.delibService.getPage();
      } else {
        console.log("Keep alive");
      }
    });
  }

  onAdd() {
    const dialogRef = this.dialog.open(AddComponent);
    dialogRef.afterClosed().subscribe(result => {
       if(result) {
         this.delibService.createStatement(result);
       }
    });
  }

  onFocus(sid: string) {
    this.router.navigate([encodeURIComponent(this.delibService.server),
                          this.delibService.agent,
                          this.delibService.contract],
                         { queryParams: { sid: sid } });
    this.delibService.sid = sid;
    this.delibService.getPage();
  }

  onDefocus() {
    let sid = this.delibService.parent ? this.delibService.parent.parent : null;
    this.router.navigate([encodeURIComponent(this.delibService.server),
                          this.delibService.agent,
                          this.delibService.contract],
                         { queryParams: sid ? { sid: sid } : null});
     this.delibService.sid = sid;
     this.delibService.getPage();
  }

  onSort() {
    let ranking = this.delibService.parent && this.delibService.agent in this.delibService.parent.ranking_kids ?
                  this.delibService.parent.ranking_kids[this.delibService.agent] :
                  [[],[]];
    const dialogRef = this.dialog.open(SortComponent, {data: {statements: this.delibService.kids, ranking: ranking}});
    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.delibService.setRanking(this.delibService.sid as string, result);
      }
    });
  }

  getName(owner: string) {
    return owner.slice(0, 4) + '...' + owner.slice(-4);
  }

  hasKids() {
    return Object.keys(this.delibService.kids).length > 0;
  }
}
