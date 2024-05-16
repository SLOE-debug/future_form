import SvgIcon from "@/Components/SvgIcon";
import { suffix2Color } from "@/Utils/VirtualFileSystem/Index";
import { SearchTree } from "@/Vuex/Modules/VirtualFileSystem";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { ElInput } from "element-plus";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class Search extends Vue {
    created (){

    }

    searchText = '';
    searchRes : SearchTree[] = [];

    //搜索框触发事件
    async SearchChange(){
        if(this.searchText){
        this.searchRes = await this.$Store.dispatch("VirtualFileSystem/SearchContent",this.searchText);
        //console.log(this.searchRes);
        } 
    }

    //树状结果单击事件
    async HandleNodeClick(node){
        //console.log(node);
        if('expand' in node){
        node.expand = !node.expand;
        } 

        this.searchRes.forEach(s=>{
        s.selected = false;
        s.children.forEach(c=>{
            c.selected = false;
        });
        });

        node.selected = !node.selected;
    }

    render(){
        return (
            <div>
                <div class={css.searchSelector}>
                    <ElInput
                            v-model={this.searchText}
                            style={{ width: "95%" }}
                            placeholder="请输入搜索词"
                            class={css.searchInput}
                            onChange={this.SearchChange}
                            clearable
                            onClear={()=>{this.searchRes=[]}}
                            />
                </div>
                <div class={css.searchDiv}>
                {this.searchRes.map((m) => {
                    return (
                    <>
                        <div onClick={()=>{this.HandleNodeClick(m)}} class={[css.searchFileDiv , m.selected ? css.searchActive : ""]}>
                        <div class={css.searchFileInfo}>
                            {m.expand && (<span class={css.iconSpan}><FontAwesomeIcon icon={'chevron-down'} /></span>)}
                            {!m.expand && (<span class={css.iconSpan}><FontAwesomeIcon icon={'chevron-right'} /></span>)}
                            <SvgIcon {...{ name: `FileSuffix_${m.suffix}`, color: suffix2Color[m.suffix] }}></SvgIcon>
                            <span class={css.labSpan}>{m.label}</span>
                        </div>
                        </div>
                        {m.expand && (m.children.map(c=>{
                        return(
                            <div title={c.content_a+c.label+c.content_b} onClick={()=>{this.HandleNodeClick(c)}} class={[css.searchContentDiv, c.selected ? css.searchActive : ""]}>
                            <span class={css.contentFirstSpan}>{c.content_a} </span>
                            <span class={css.highlight}>&nbsp;{c.label}&nbsp;</span>
                            <span class={css.contentLastSpan}>{c.content_b}</span>
                            </div>
                        )
                        }))}
                    </>
                    );
                })}
                </div>
            </div>
        )
    }
}