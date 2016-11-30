// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import $ from 'jquery';
import ReactDOM from 'react-dom';
import * as UserAgent from 'utils/user_agent.jsx';

import {localizeMessage} from 'utils/utils.jsx';
import {FormattedMessage} from 'react-intl';

import React from 'react';
import loadingGif from 'images/load.gif';

const NEXT_BUTTON_TIMEOUT = 500;

export default class MoreChannelsList extends React.Component {
    constructor(props) {
        super(props);

        this.nextPage = this.nextPage.bind(this);
        this.previousPage = this.previousPage.bind(this);
        this.handleFilterChange = this.handleFilterChange.bind(this);
        this.createChannelRow = this.createChannelRow.bind(this);

        this.nextTimeoutId = 0;

        this.state = {
            page: 0,
            filter: '',
            joiningChannel: '',
            channels: props.channels
        };
    }

    componentWillReceiveProps(nextProps) {
        // assume the channel list is immutable
        if (this.props.channels !== nextProps.channels) {
            this.setState({channels: nextProps.channels});
        }
    }

    componentDidMount() {
        // only focus the search box on desktop so that we don't cause the keyboard to open on mobile
        if (!UserAgent.isMobile()) {
            ReactDOM.findDOMNode(this.refs.filter).focus();
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.page !== prevState.page) {
            $(ReactDOM.findDOMNode(this.refs.channelList)).scrollTop(0);
        }
    }

    nextPage(e) {
        e.preventDefault();
        this.setState({page: this.state.page + 1, nextDisabled: true});
        this.nextTimeoutId = setTimeout(() => this.setState({nextDisabled: false}), NEXT_BUTTON_TIMEOUT);
        this.props.nextPage(this.state.page + 1);
    }

    previousPage(e) {
        e.preventDefault();
        this.setState({page: this.state.page - 1});
    }

    clearFilters(channels) {
        this.setState({filter: '', channels});
    }

    handleJoin(channel) {
        this.setState({joiningChannel: channel.id});
        this.props.handleJoin(
            channel,
            () => {
                this.setState({joiningChannel: ''});
            });
    }

    createChannelRow(channel) {
        let joinButton;
        if (this.state.joiningChannel === channel.id) {
            joinButton = (
                <img
                    className='join-channel-loading-gif'
                    src={loadingGif}
                />
            );
        } else {
            joinButton = (
                <button
                    onClick={this.handleJoin.bind(this, channel)}
                    className='btn btn-primary'
                >
                    <FormattedMessage
                        id='more_channels.join'
                        defaultMessage='Join'
                    />
                </button>
            );
        }

        return (
            <div
                className='more-modal__row'
                key={channel.id}
            >
                <div className='more-modal__details'>
                    <p className='more-modal__name'>{channel.display_name}</p>
                    <p className='more-modal__description'>{channel.purpose}</p>
                </div>
                <div className='more-modal__actions'>
                    {joinButton}
                </div>
            </div>
        );
    }

    handleFilterChange(e) {
        this.setState({page: 0, filter: e.target.value});
        this.props.search(e.target.value);
    }

    render() {
        const channels = Object.values(this.state.channels);

        let nextButton;
        let previousButton;
        let count;

        const startCount = this.state.page * this.props.channelsPerPage;
        const endCount = startCount + this.props.channelsPerPage;
        const channelsToDisplay = channels.slice(startCount, endCount);

        if (channelsToDisplay.length >= this.props.channelsPerPage) {
            nextButton = (
                <button
                    className='btn btn-default filter-control filter-control__next'
                    onClick={this.nextPage}
                    disabled={this.state.nextDisabled}
                >
                    {'Next'}
                </button>
            );
        }

        if (this.state.page > 0) {
            previousButton = (
                <button
                    className='btn btn-default filter-control filter-control__prev'
                    onClick={this.previousPage}
                >
                    {'Previous'}
                </button>
            );
        }

        if (this.props.total) {
            count = (
                <FormattedMessage
                    id='filtered_user_list.countTotalPage'
                    defaultMessage='{startCount, number} - {endCount, number} {count, plural, =0 {0 channels} one {channel} other {channels}} of {total} total'
                    values={{
                        count: channelsToDisplay.length,
                        startCount: startCount + 1,
                        endCount,
                        total: this.props.total
                    }}
                />
            );
        }

        return (
            <div className='filtered-user-list'>
                <div className='filter-row'>
                    <div className='col-sm-6'>
                        <input
                            ref='filter'
                            className='form-control filter-textbox'
                            placeholder={localizeMessage('filtered_channels_list.search', 'Search channels')}
                            onInput={this.handleFilterChange}
                            value={this.state.filter}
                        />
                    </div>
                    <div className='col-sm-12'>
                        <span className='channel-count pull-left'>{count}</span>
                    </div>
                </div>
                <div
                    ref='channelList'
                    className='more-modal__list'
                >
                    {channelsToDisplay.map(this.createChannelRow)}
                </div>
                <div className='filter-controls'>
                    {previousButton}
                    {nextButton}
                </div>
            </div>
        );
    }
}

MoreChannelsList.defaultProps = {
    channels: [],
    channelsPerPage: 50 //eslint-disable-line no-magic-numbers
};

MoreChannelsList.propTypes = {
    channels: React.PropTypes.arrayOf(React.PropTypes.object),
    handleJoin: React.PropTypes.func.isRequired,
    channelsPerPage: React.PropTypes.number,
    total: React.PropTypes.number,
    nextPage: React.PropTypes.func.isRequired,
    search: React.PropTypes.func.isRequired
};