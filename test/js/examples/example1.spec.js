import { expect } from 'chai';
import sinon from 'sinon';
import * as example1 from '../../../src/js/examples/example1';
import { JSDOM } from 'jsdom';
import { VirtualTimeScheduler, Subscriber, Observable } from 'rxjs';

describe('Example 1', () => {
    describe('initialize function', () => {
        let window;

        beforeEach(() => {
            window = new JSDOM('<button class="button_1">Button</button><div class="rectangle_1"></div>').window;
            global.window =  window;
            global.document = window.document;
        });

        afterEach(() => {
            global.window = undefined;
            global.document = undefined;
        });

        describe('observable configuration', () => {
            let delayStub;
            let subscribeSpy;

            beforeEach(() => {
                subscribeSpy = sinon.spy();
                delayStub = sinon.stub().withArgs(1000).returns({ subscribe: subscribeSpy });

                sinon.stub(Observable, 'fromEvent').returns({ delay: delayStub, subscribe: subscribeSpy });
            });

            afterEach(() => {
                Observable.fromEvent.restore();
            });

            it('should call Observable.fromEvent with arguments: a HTMLButtonElement instance and the string "click"', () => {
                example1.initialize(Observable);
                expect(Observable.fromEvent.calledOnce, 'fromEvent not called once').equal(true);
                expect(Observable.fromEvent.args[0][0]).to.be.an.instanceOf(window.HTMLButtonElement, `fromEvent call: First argument is not a HTMLButtonElement instance`);
                expect(Observable.fromEvent.args[0][0].className).to.equal(`button_1`, `fromEvent call: First argument does not have the class "button1"`);
                expect(Observable.fromEvent.args[0][1]).to.equal('click', `fromEvent call: Second argument is not "click"`);
            });

            it('should call delay with arguments: 1000 and a scheduler instance', () => {
                example1.initialize(Observable, new VirtualTimeScheduler());
                expect(delayStub.calledOnce, 'delay not called once').equal(true);
                expect(delayStub.args[0][1]).to.be.an.instanceOf(VirtualTimeScheduler);
            });

            it('should call subscribe with argument: A function that calls fillElementWithRandomColor function to fill the .rectangle_1 element', () => {
                example1.initialize(Observable);
                expect(subscribeSpy.calledOnce, 'subscribe not called once').equal(true);
            });
        });

        describe('return', () => {
            it('should return an Observable and a Subscriber', () => {
                const [ buttonClickedObservable, subscriber ] = example1.initialize();

                expect(buttonClickedObservable, 'Observable not returned').to.be.an.instanceOf(Observable);
                expect(subscriber, 'Subscriber not returned').to.be.an.instanceOf(Subscriber);
            });
        });

        describe('observable behaviour', () => {
            it('should emit after 1 second of clicking button', () => {
                const scheduler = new VirtualTimeScheduler(undefined, 1000);
                const rectangleElement = document.querySelector('.rectangle_1');
                const [ buttonClickedObservable] = example1.initialize(Observable, scheduler);
                const subscriberCallbackSpy = sinon.spy();

                const subscriber = buttonClickedObservable.subscribe(subscriberCallbackSpy);

                document.querySelector('.button_1').dispatchEvent(new window.Event('click'));
                expect(subscriberCallbackSpy.notCalled, 'Observable emitted a value').equal(true);

                scheduler.flush();

                expect(subscriberCallbackSpy.calledOnce, 'Observable not emitted a value').equal(true);
            });
        });

        describe('subscriber behaviour', () => {
            it('should set background of .rectangle_1 with a random rgb value after 1 second of clicking button', () => {
                const scheduler = new VirtualTimeScheduler(undefined, 1000);
                const rectangleElement = document.querySelector('.rectangle_1');

                example1.initialize(Observable, scheduler);

                document.querySelector('.button_1').dispatchEvent(new window.Event('click'));
                expect(rectangleElement.style.background, 'rectangle not empty just after clicking button').equal('');

                scheduler.flush();

                expect(rectangleElement.style.background, 'rectangle not empty 1 second after clicking button').to.contain('rgb');
            });
        });
    });
});