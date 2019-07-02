import React from 'react';
import './Wall.css';
import Header from '../Header/Header'
import {Container} from "@material-ui/core";
import {getAllThreads, getThreadsByTag, getThreadsByUserId} from "../../blockchain/MessageService";
import {Thread} from "../../types";

import {RouteComponentProps} from "react-router";
import {ThreadCard} from "../ThreadCard/ThreadCard";
import {NewThreadButton} from "../buttons/NewThreadButton";
import {ProfileCard} from "../user/Profile/ProfileCard";

interface MatchParams {
    userId: string,
    tag: string
}

export interface WallProps extends RouteComponentProps<MatchParams> {

}

export interface WallState {
    threads: Thread[];
    id: string;
    truncated: boolean;
}

export class Wall extends React.Component<WallProps, WallState> {

    constructor(props: WallProps) {
        super(props);
        this.state = {
            threads: [],
            id: "",
            truncated: true
        };

        this.retrieveThreads = this.retrieveThreads.bind(this);
        this.renderUserPageIntro = this.renderUserPageIntro.bind(this);
    }

    componentDidMount(): void {
        this.retrieveThreads();
    }

    retrieveThreads() {
        console.log("Retrieving threads!");
        const userId = this.props.match.params.userId;
        const tag = this.props.match.params.tag;
        if (userId != null) {
            getThreadsByUserId(userId).then(retrievedThreads => {
                this.setState(prevState => ({
                    threads: retrievedThreads,
                    id: prevState.id,
                    truncated: prevState.truncated
                }));
            });

        } else if (tag != null) {
            getThreadsByTag(tag).then(retrievedThreads => {
                this.setState(prevState => ({
                    threads: retrievedThreads,
                    id: prevState.id,
                    truncated: prevState.truncated
                }));
            });
        } else {
            getAllThreads().then(retrievedThreads => {
                console.log("Retrieved threads: ", retrievedThreads);
                this.setState({
                    threads: retrievedThreads
                });
            });
        }
    }

    renderUserPageIntro() {
        if (this.props.match.params.userId != null) {
            return (
                <ProfileCard username={this.props.match.params.userId}/>
            )
        }
    }

    render() {
        return (
            <div>
                <Header/>
                <Container fixed maxWidth="md">
                    <br/>
                    {this.renderUserPageIntro()}
                    {this.state.threads.map(thread => <ThreadCard
                        key={"card-" + thread.id}
                        truncated={true}
                        isSubCard={false}
                        isUserPage={this.props.match.params.userId != null}
                        thread={thread}
                    />)}
                </Container>
                {this.props.match.params.userId == null ? <NewThreadButton updateFunction={this.retrieveThreads}/> : <div></div>}
            </div>
        );
    }

}
