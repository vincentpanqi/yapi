import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './index.scss'
import { Alert, Modal, Row, Col, Icon, Collapse, Input, Tooltip } from 'antd'
import MockList from './MockList.js'
import MethodsList from './MethodsList.js'
import VariablesSelect from './VariablesSelect.js'
import { handleParamsValue } from '../../common.js'
const Panel = Collapse.Panel;

// 深拷贝
function deepEqual(state) {
  return JSON.parse(JSON.stringify(state))
}

function closeRightTabsAndAddNewTab(arr, index, curname, params) {
  let newParamsList = [].concat(arr);
  newParamsList.splice(index + 1, newParamsList.length - index);
  newParamsList.push({
    name: '', params: []
  })

  let curParams = params || [];
  newParamsList[index] = {
    ...newParamsList[index],
    name: curname,
    params: curParams
  }
  return newParamsList;

}


class ModalPostman extends Component {
  static propTypes = {
    visible: PropTypes.bool,
    handleCancel: PropTypes.func,
    handleOk: PropTypes.func,
    inputValue: PropTypes.any,
    envType: PropTypes.string,
    id: PropTypes.number
  }

  constructor(props) {
    super(props)
    this.state = {
      methodsShow: false,
      methodsShowMore: false,
      methodsList: [],
      constantInput: '',
      methodsParamsList: [{
        name: '',
        params: [],
        type: 'dataSource'
      }]
    }

  }


  componentWillReceiveProps(nextProps) {
    if (nextProps.visible) {
      this.setState({
        constantInput: nextProps.inputValue
      })
      nextProps.inputValue && this.handleConstantsInput(nextProps.inputValue, 0);
    }
  }

  mockClick(index) {
    return (curname, params) => {
      console.log('curname', curname);
      let newParamsList = closeRightTabsAndAddNewTab(this.state.methodsParamsList, index, curname, params)
      this.setState({
        methodsParamsList: newParamsList
      })
    }
  }
  //  处理常量输入 
  handleConstantsInput = (val, index) => {

    // val = val.match(/^\{\{(.+)\}\}$/g);
    // val = RegExp.$1;
    val = val.replace(/^\{\{(.+)\}\}$/g, '$1');
    console.log('val', val);
    this.setState({
      constantInput: val
    })
    this.mockClick(index)(val);
  }

  handleParamsInput = (e, clickIndex, paramsIndex) => {
    let newParamsList = deepEqual(this.state.methodsParamsList);
    newParamsList[clickIndex].params[paramsIndex] = e
    this.setState({
      methodsParamsList: newParamsList
    })
  }

  // 方法
  MethodsListSource = (props) => {
    return <MethodsList
      click={this.mockClick(props.index)}
      clickValue={props.value}
      paramsInput={this.handleParamsInput}
      clickIndex={props.index}
    />
  }


  //  处理表达式
  handleValue(val) {
    return handleParamsValue(val, {});
  }

  // 处理错误
  handleError() {
    return <Alert
      message="请求“变量集”尚未运行,所以我们无法从其响应中提取的值。您可以在测试集合中测试这些变量。"
      type="warning"
    />
  }

  // 初始化
  setInit() {
    let initParamsList = [{
      name: '',
      params: [],
      type: 'dataSource'
    }]
    this.setState({
      methodsParamsList: initParamsList
    })
  }
  // 处理取消插入
  handleCancel = () => {
    this.setInit();
    this.props.handleCancel();
  }

  // 处理插入
  handleOk = (installValue) => {
    this.props.handleOk(installValue);
    this.setInit();
  }

  render() {
    const { visible, envType } = this.props
    const { methodsParamsList, constantInput } = this.state;

    const outputParams = () => {
      let str = '';
      let length = methodsParamsList.length;
      methodsParamsList.forEach((item, index) => {
        let isShow = item.name && length - 2 !== index;
        str += item.name;
        item.params.forEach((item, index) => {
          let isParams = index > 0;
          str += isParams ? ' , ' : ' : ';
          str += item
        })
        str += isShow ? ' | ' : '';
      })
      return '{{ ' + str + ' }}'
    }

    return (
      <Modal
        title={<p><Icon type="edit" /> 高级参数设置</p>}
        visible={visible}
        onOk={() => this.handleOk(outputParams())}
        onCancel={this.handleCancel}
        wrapClassName="modal-postman"
        width={1024}
        maskClosable={false}
        okText="插入"
      >

        <Row className="modal-postman-form" type="flex">
          {
            methodsParamsList.map((item, index) => {
              return item.type === 'dataSource' ?
                <Col span={8} className="modal-postman-col" key={index}>
                  <Collapse className="modal-postman-collapse" defaultActiveKey={['1']} bordered={false} accordion>
                    <Panel header={<h3 className="mock-title">常量</h3>} key="1">
                      <Input placeholder="基础参数值" value={constantInput} onChange={(e) => this.handleConstantsInput(e.target.value, index)} />
                    </Panel>
                    <Panel header={<h3 className="mock-title">mock数据</h3>} key="2">
                      <MockList click={this.mockClick(index)} clickValue={item.name}></MockList>
                    </Panel>
                    {
                      envType === 'case' && <Panel
                        header={<h3 className="mock-title">变量&nbsp;<Tooltip placement="top" title="YApi 提供了强大的变量参数功能，你可以在测试的时候使用前面接口的 参数 或 返回值 作为 后面接口的参数，即使接口之间存在依赖，也可以轻松 一键测试~"><Icon type="question-circle-o" /></Tooltip></h3>}
                        key="3">
                        <VariablesSelect id={this.props.id} click={this.mockClick(index)} />
                      </Panel>
                    }
                  </Collapse>
                </Col>
                :
                <Col span={8} className="modal-postman-col" key={index}>
                  <this.MethodsListSource index={index} value={item.name} />
                </Col>
            })
          }
        </Row>
        <Row className="modal-postman-expression">
          <Col span={6}><h3 className="title">表达式</h3></Col>
          <Col span={18}>
            <span className="expression-item">{outputParams()}</span>
          </Col>
        </Row>
        <Row className="modal-postman-preview">
          <Col span={6}><h3 className="title">预览</h3></Col>
          <Col span={18}>
            <h3>
              {this.handleValue(outputParams()) || outputParams() && this.handleError()}
            </h3>
          </Col>
        </Row>
      </Modal>
    )
  }
}

export default ModalPostman;