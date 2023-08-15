import { Component, OnInit, HostListener } from '@angular/core';
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

  hoverElement = '';
  
  constructor(
    private route: ActivatedRoute,
    private agentService: AgentService,
    public delibService: DelibService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('initializing page component');
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    let server = this.route.snapshot.queryParamMap.get('server') || '';
    let agent = this.route.snapshot.queryParamMap.get('agent') || '';
    let contract = this.route.snapshot.queryParamMap.get('contract') || '';
    if (!server || !agent || !contract) {
      this.router.navigate(['oops']);
    } else {
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
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
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
    this.router.navigate([],
                         { queryParams: { server: this.delibService.server,
                                          agent: this.delibService.agent,
                                          contract: this.delibService.contract,
                                          sid: sid } });
    this.delibService.sid = sid;
    this.delibService.getPage();
  }

  onDefocus() {
    let sid = this.delibService.parent ? this.delibService.parent.parent : null;
    this.router.navigate([],
      { queryParams: { server: this.delibService.server,
                       agent: this.delibService.agent,
                       contract: this.delibService.contract,
                       sid: sid } });
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

  onDelete() {
    this.delibService.deleteStatement();
    this.onDefocus();
  }

  getName(owner: string) {
    return owner.slice(0, 4) + '...' + owner.slice(-4);
  }

  hasKids() {
    return Object.keys(this.delibService.kids).length > 0;
  }
}
