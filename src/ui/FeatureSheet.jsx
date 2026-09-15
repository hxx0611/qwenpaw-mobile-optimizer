// 功能面板：官方 overlay.global 槽里的 antd Drawer（底部抽屉，原生观感）。
// 条目分两类，诚实标注：
//   · API/路由驱动（模型选择、模型管理、工具管理、返回聊天）——不依赖官方 DOM，稳；
//   · 官方控件合成点击（新建会话、工作区、Loop、审批模式）——依赖 legacy/click.js 的信号，
//     聊天页找不到信号才显示「入口缺失」并禁用；非聊天页 composer 未挂载属正常态，
//     标「需回聊天页」且保留点击：自动 navigate('/') 后轮询等挂载代点（waitOfficial）。

import { antd, icons, toast } from '../api/qw.js';
import { useAppState, set, toggleSheet } from '../state.js';
import { clickOfficial, waitOfficial, availability } from '../legacy/click.js';
import { navigate, isChatRoute } from '../api/nav.js';
import { listProviders, getActive, buildOptions, setActive } from '../api/models.js';

export function FeatureSheet() {
  var R = window.QwenPaw.host.React;
  var useState = R.useState;
  var useEffect = R.useEffect;
  var A = antd();
  var I = icons();
  var st = useAppState();
  var _a = useState(null), active = _a[0], setActiveInfo = _a[1];
  var _o = useState(null), opts = _o[0], setOpts = _o[1];
  var _b = useState(false), busy = _b[0], setBusy = _b[1];
  var _v = useState({}), avail = _v[0], setAvail = _v[1];

  // 每次开面板重新探测官方入口（官方可能刚渲染完或刚换页）
  useEffect(
    function () {
      if (st.sheet) setAvail(availability());
    },
    [st.sheet],
  );

  // 当前模型：进面板/进模型视图时拉一次
  useEffect(
    function () {
      var stop = false;
      getActive()
        .then(function (j) {
          if (!stop) setActiveInfo((j && j.active_llm) || null);
        })
        .catch(function (e) {
          if (!stop) setActiveInfo({ error: String((e && e.message) || e) });
        });
      return function () {
        stop = true;
      };
    },
    [st.sheet, st.modelView],
  );

  function openModelView() {
    set({ modelView: true });
    if (opts) return;
    listProviders()
      .then(function (ps) {
        setOpts(buildOptions(ps));
      })
      .catch(function (e) {
        toast('模型列表加载失败：' + ((e && e.message) || e), 'error');
        setOpts([]);
      });
  }

  function onPick(val) {
    var parts = String(val).split('::');
    if (parts.length < 2) return;
    setBusy(true);
    setActive(parts[0], parts[1])
      .then(function () {
        setActiveInfo({ provider_id: parts[0], model: parts[1] });
        toast('已切换到 ' + parts[1]);
      })
      .catch(function (e) {
        toast('切换失败：' + ((e && e.message) || e), 'error');
      })
      .finally(function () {
        setBusy(false);
      });
  }

  function close() {
    toggleSheet(false);
    set({ modelView: false });
  }

  // 合成点击条目三段式（方案A）：本页有信号直接点；不在聊天页则先 navigate('/')
  // 再轮询等 composer 挂载代点；聊天页真没信号才报错。绝不出现"点了没反应"的死按钮。
  function composerEntry(key) {
    var r = clickOfficial(key);
    if (r.ok) {
      close();
      return;
    }
    if (!isChatRoute()) {
      navigate('/');
      waitOfficial(key, 5000).then(function (r2) {
        if (r2.ok) close();
        else toast('已回聊天页，但官方入口未挂载（' + r2.via + '）', 'error');
      });
      return;
    }
    toast('没找到官方入口：' + key, 'error');
  }

  var onChat = isChatRoute();
  function composerItem(sigKey, label, Icon) {
    var miss = avail[sigKey] === false;
    return {
      key: sigKey,
      label: label,
      icon: Icon,
      disabled: miss && onChat, // 聊天页真缺失 → 禁用
      hint: miss && !onChat, // 非聊天页未挂载 → 可点，先回聊天页
      run: function () {
        composerEntry(sigKey);
      },
    };
  }

  var items = [];
  items.push({
    key: 'newChat',
    label: '新建会话',
    icon: I.MessageOutlined,
    disabled: false, // 有 navigate('/') 兜底，永不缺失
    run: function () {
      var r = clickOfficial('newChat');
      if (!r.ok) navigate('/');
      close();
    },
  });
  items.push({
    key: 'model',
    label: '模型选择',
    sub: active && active.model ? active.provider_id + ' / ' + active.model : '读取中…',
    icon: I.RobotOutlined,
    run: openModelView,
  });
  items.push({
    key: 'modelManage',
    label: '模型管理',
    sub: '/models',
    icon: I.SettingOutlined,
    run: function () {
      close();
      navigate('/models');
    },
  });
  items.push({
    key: 'toolManage',
    label: '工具管理',
    sub: '/tools',
    icon: I.ToolOutlined,
    run: function () {
      close();
      navigate('/tools');
    },
  });
  items.push(composerItem('workspace', '打开文件工作区', I.FolderOpenOutlined));
  items.push(composerItem('loopMode', 'Loop 模式', I.SyncOutlined));
  items.push(composerItem('approval', '工具审批模式', I.SafetyCertificateOutlined));
  if (!isChatRoute()) {
    items.push({
      key: 'back',
      label: '返回聊天',
      icon: I.HomeOutlined,
      run: function () {
        close();
        navigate('/');
      },
    });
  }

  var Back = I.ArrowLeftOutlined;

  // 当前模型可能不在任何 provider 的 models/extra/discovered 列表里（例如刚配的自定义模型），
  // 那样 Select 找不到 option 会把原始 value "provider::model" 直接显示出来（实测踩过）。
  // 兜底：找不到就插一个「当前模型」分组，保证永远显示成人能读的名字。
  function optionsWithActive() {
    var list = opts || [];
    if (active && active.provider_id && active.model) {
      var key = active.provider_id + '::' + active.model;
      var found = false;
      list.forEach(function (g) {
        (g.options || []).forEach(function (o) {
          if (o.value === key) found = true;
        });
      });
      if (!found) {
        list = [{ label: '当前模型', options: [{ value: key, label: active.model }] }].concat(list);
      }
    }
    return list;
  }

  var body = st.modelView ? (
    <div className="mo2-sheet-body">
      <div className="mo2-sheet-head">
        <A.Button
          size="small"
          type="text"
          aria-label="mo2-返回条目"
          icon={Back ? <Back /> : '←'}
          onClick={function () {
            set({ modelView: false });
          }}
        />
        <span className="mo2-sheet-title">模型选择</span>
      </div>
      <A.Select
        className="mo2-model-select"
        showSearch
        loading={busy}
        disabled={busy}
        placeholder={opts ? '选择模型' : '加载模型列表…'}
        value={active && active.model && active.provider_id ? active.provider_id + '::' + active.model : undefined}
        options={optionsWithActive()}
        onChange={onPick}
        optionFilterProp="label"
        style={{ width: '100%' }}
      />
      {active && active.error ? <div className="mo2-err">当前模型读取失败：{active.error}</div> : null}
    </div>
  ) : (
    <A.List
      className="mo2-sheet-list"
      split={false}
      dataSource={items}
      renderItem={function (it) {
        var Ic = it.icon;
        var off = !!it.disabled;
        return (
          <A.List.Item
            className={'mo2-row-item' + (off ? ' mo2-off' : '')}
            onClick={function () {
              if (!off) it.run();
            }}
          >
            <span className="mo2-row-ico">{Ic ? <Ic /> : '·'}</span>
            <span className="mo2-row-main">
              <span className="mo2-row-label">{it.label}</span>
              {it.sub ? <span className="mo2-row-sub">{it.sub}</span> : null}
            </span>
            {off ? (
              <A.Tag color="orange">入口缺失</A.Tag>
            ) : it.hint ? (
              <A.Tag color="blue">需回聊天页</A.Tag>
            ) : null}
          </A.List.Item>
        );
      }}
    />
  );

  if (!A || !A.Drawer) return null;

  return (
    <A.Drawer
      title="功能面板"
      placement="bottom"
      open={!!st.sheet}
      onClose={close}
      height="78%"
      className="mo2-drawer"
      rootClassName="mo2-drawer-root"
      destroyOnClose
      styles={{ body: { padding: '4px 14px 18px' } }}
      getContainer={false}
    >
      {body}
    </A.Drawer>
  );
}
