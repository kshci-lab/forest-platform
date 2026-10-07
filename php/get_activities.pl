

%ルールの定義
%親子の定義
parent_of(X,Y) :- operation_log(datetime(_), ibss_log( Y, _, _, _, _, X)). % X＝親，Y=子

%祖先的なやつ
ancestor_of(X, Y) :- parent_of(X, Y). %X=祖先，Y=子孫
ancestor_of(X, Y) :- parent_of(X, Z), ancestor_of(Z, Y).

%時系列のルール
%time_compare(比較１，比較２，後の方)
time_compare(X,Y,X) :- X @> Y,!. %Xの方が後ならカット
time_compare(X,Y,Y) :- X @< Y.   %それ以外，つまりYの方が後ならカット


%同じノードへの操作
node_operation_of(X,Y)
:- operation_log(datetime(X), ibss_log( NodeID, _, _, _, _, _)),
   operation_log(datetime(Y), ibss_log( NodeID, _, _, _, _, _)).

%ある時(X)より昔でnode_idはYのノードの日にち
period_new_node(X,Y,K)
:- operation_log(datetime(K), ibss_log( Y, _, _, _, _, _)),K @< X.

%ある時(X)より昔でnode_idはYのノードの日にちを全て求める
period_old_nodeList(X, Ls) :- period_sub(X, [], Ls).
period_sub(X, C, Ls) :-
  period_old_node(X,Y, C1), not(member(C1, C)), !,
  period_sub(X, [C1 | C], Ls).
period_sub(_, Ls, Ls).


%あるノードに対する動作を全て求める
% リスト：父親 X の子供をすべて L に求める
node_operation(X, Ls) :- node_operation_sub(X, [], Ls).
node_operation_sub(X, C, Ls) :-
  node_operation_of(X, C1), not(member(C1, C)), !,
  node_operation_sub(X, [C1 | C], Ls).
node_operation_sub(_, Ls, Ls).

%リストを古い順に並び替え
time_sort([X | Xs], Ys) :-
        partition(Xs, X, Littles, Bigs),
        quick(Littles, Ls),
        quick(Bigs, Bs),
        append(Ls, [X | Bs], Ys).
quick([], []).

%ノード操作を古い順に並び替えてから求める
node_operation_timeList(X,L) :-
  node_operation(X, T),
  time_sort(T,L).

  period_old_node(X,Y,K)
  :- operation_log(datetime(K), ibss_log( Y, _, _, _, _, _)),K @< X.


  %ある時(X)より昔でnode_idはYのノードの日にちを全て求める
  period_old_nodeList(X, Y, Ls) :- period_sub(X, Y, [], Ls).
  period_sub(X, Y, C, Ls) :-
    period_old_node(X, Y, C1), not(member(C1, C)), !,
    period_sub(X, Y, [C1 | C], Ls).
  period_sub(_, _, Ls, Ls).


%最大値を取得
  newest_node(L,M) :-
        L = [F|R],
        newest_node(R,F,M).
  newest_node([],M,M).
  newest_node([Y|R],Mb,M) :-
        Y > Mb,!,
        newest_node(R,Y,M).
  newest_node([Y|R],Mb,M) :-
        newest_node(R,Mb,M).


        partition3([X | Xs], Y, [X | Ls], Bs) :-
                X @>= Y, partition3(Xs, Y, Ls, Bs).
        partition3([X | Xs], Y, Ls, [X | Bs]) :-
                X @< Y, partition3(Xs, Y, Ls, Bs).
        partition3([], Y, [], []).

        % %リストに要素が含まれているか．Xに変数を置くと一番最初の物を取り出すことができる
        my_member(X, [X | Ls]).
        my_member(X, [Y | Ls]) :- my_member(X, Ls).

        %リストの最初の値を取り出す
        first([X|_], X).


        %リストを新しい順に並び替え
        time_sort_newest([X | Xs], Ys) :-
                partition3(Xs, X, New, Old),
                time_sort_newest(New, Ls),
                time_sort_newest(Old, Os),
                append(Ls, [X | Os], Ys).
        time_sort_newest([], []).








        %ある時点に置いて最新の操作を取り出す
        newestDate_at_time(AtTime, NodeID, Newest_Node_time)
        :- period_old_nodeList(AtTime, NodeID, Node_ope_list),       %その時以前に加えられたノード操作の時間をリストに格納する
           time_sort_newest(Node_ope_list,Sort_Node_ope_list),              %リストを〜順に並び替える
           first(Sort_Node_ope_list, Newest_Node_time).%リストの最初のやつ(一番新しいやつ)を取り出す

        %operation_log(datetime(日時), ibss_log( ノードID, 操作, ノードタイプ, 概念ID, ノードテキスト, 親ノードID)).








%１. (real pattern_1)祖先を編集した後子孫を編集すること
pattern(rule_1, [Pattern, Template, Status, Act1, Act2, Act3, Act4, Act5, Act6])

 :- (operation_log(datetime(Act1), ibss_log( Qnode1, Activity1, Type1, _, _, _)), Type1\=='answer', Activity1\=='add'),

    (operation_log(datetime(Act2), ibss_log( Anode1, Activity2, 'answer', _, _, Qnode1)), Activity2\=='add'),

    operation_log(datetime(Act3), ibss_log( Anode1, 'edit', 'answer', _, _, Qnode1)),

    (operation_log(datetime(Act4), ibss_log( Qnode2, Activity4, Type4, _, _, _)), Type4\=='answer', Activity4\=='add'),

    (operation_log(datetime(Act5), ibss_log( Anode2, Activity5, 'answer', _, _, Qnode2)), Activity5\=='add', time_compare(Act3,Act5,Act3), newestDate_at_time(Act3, Anode2, Act5)),

    (operation_log(datetime(Act6), ibss_log( Anode2, 'edit', 'answer', _, _, _)),

     ancestor_of(Qnode1, Qnode2), newestDate_at_time(Act3, Anode1, Act2),

     newestDate_at_time(Act6, Qnode1, Act1), newestDate_at_time(Act6, Anode1, Act3), newestDate_at_time(Act6, Qnode2, Act4), newestDate_at_time(Act6, Anode2, Act5),

     Status='full', Template='template_1_1', Pattern='pattern_1').






pattern(rule_2, [Pattern, Template, Status, Act1, Act2, Act3, Act4, Act5, Act6])

 :- (operation_log(datetime(Act1), ibss_log( Qnode1, Activity1, Type1, _, _, _)), Type1\=='answer', Activity1\=='add'),

    operation_log(datetime(Act2_1), ibss_log( Anode1, Activity2, 'answer', _, _, Qnode1)),

    operation_log(datetime(Act3_1), ibss_log( Anode1, 'edit', 'answer', _, _, Qnode1)),

    (operation_log(datetime(Act4_1), ibss_log( Qnode2, Activity4, Type4, _, _, _)), Type4\=='answer', Activity4\=='add'),

    (operation_log(datetime(Act5_1), ibss_log( Anode2, Activity5, 'answer', _, _, Qnode2)), Activity5\=='add'),

    (operation_log(datetime(Act6_1), ibss_log( Anode2, 'edit', 'answer', _, _, _)),

     ancestor_of(Qnode2, Qnode1), newestDate_at_time(Act3_1, Anode1, Act2_1),

     newestDate_at_time(Act6_1, Qnode1, Act1), newestDate_at_time(Act6_1, Anode1, Act3_1), newestDate_at_time(Act6_1, Qnode2, Act4_1), newestDate_at_time(Act6_1, Anode2, Act5_1),

     Status='full', Pattern='pattern_2'),

    ((Activity2='add')->(Template='template_1_2', Act2=Act3_1, Act3=Act4_1, Act4=Act5_1, Act5=Act6_1, Act6='null' )

                        ;(Template='template_1_1', Act2=Act2_1, Act3=Act3_1, Act4=Act4_1, Act5=Act5_1, Act6=Act6_1 )).





                        %
                        %   operation_log(datetime('2019-01-24 08:29:03.560'), ibss_log( '87d0bac3cc2a5c05', 'edit', 'prepared_question', '1509010690552_n137', '実践仮説は何ですか？', 'root')).
                        % { operation_log(datetime('2019-01-24 08:29:05.370'), ibss_log( '87d0bb350420c832', 'add', 'answer', '1509010690552_n137', 'New Node', '87d0bac3cc2a5c05')).  }
                        %   operation_log(datetime('2019-01-24 08:29:14.035'), ibss_log( '87d0bb350420c832', 'edit', 'answer', '1509010690552_n137', '実践仮説なんて知らない', '87d0bac3cc2a5c05')).
                        %   operation_log(datetime('2019-01-24 08:28:48.499'), ibss_log( '87d0b7164be317d0', 'edit', 'prepared_question', '1509010690552_n134', '実践の目的は何ですか？', 'root')).
                        %   operation_log(datetime('2019-01-24 08:29:00.961'), ibss_log( '87d0b79a4627fa1b', 'edit', 'answer', '1509010690552_n134', '実践目的なんて知らない', '87d0b7164be317d0')).
                        %   operation_log(datetime('2019-01-24 08:29:00.961'), ibss_log( '87d0b79a4627fa1b', 'edit', 'answer', '1509010690552_n134', '実践目的なんて知らない', '87d0b7164be317d0')).



 pattern(rule_3, [Pattern, Template, Status, Act1, Act2, Act3, Act4, Act5, Act6])

  :- (operation_log(datetime(Act1), ibss_log( Qnode1, Activity1, Type1, Concept1, _, _)), Type1=='prepared_question', Activity1\=='add'),

     operation_log(datetime(Act2_1), ibss_log( Anode1, Activity2, 'answer', _, _, Qnode1)),

     (operation_log(datetime(Act3_1), ibss_log( Anode1, 'edit', 'answer', _, _, Qnode1)), newestDate_at_time(Act3_1, Anode1, Act2_1)),

     (operation_log(datetime(Act4_1), ibss_log( Qnode2, Activity4, Type4, Concept4, _, _)), Concept1 \== Concept4, class_in(Concept1, Concept4), Type4=='prepared_question', Activity4\=='add'),

     (operation_log(datetime(Act5_1), ibss_log( Anode2, Activity5, 'answer', _, _, Qnode2)), Activity5\=='add', Activity5\=='delete', time_compare(Act3_1,Act5_1,Act3_1), newestDate_at_time(Act3_1, Anode2, Act5_1)),

     ((operation_log(datetime(Act6_1), ibss_log( Anode2, 'edit', 'answer', _, _, _)),

      newestDate_at_time(Act6_1, Qnode1, Act1), newestDate_at_time(Act6_1, Anode1, Act3_1), newestDate_at_time(Act6_1, Qnode2, Act4_1), newestDate_at_time(Act6_1, Anode2, Act5_1))

          ->(Status='full', Pattern='pattern_3',
                ((Activity2='add')->(Template='template_2_2', Act2=Act3_1, Act3=Act4_1, Act4=Act5_1, Act5=Act6_1, Act6='null')
                                    ;(Template='template_2_1', Act2=Act2_1, Act3=Act3_1, Act4=Act4_1, Act5=Act5_1, Act6=Act6_1)))

            ;(Status='fail', Pattern='pattern_4',
                  ((Activity2='add')->(Template='template_4_2', Act2=Act3_1, Act3=Act4_1, Act4=Act5_1, Act5=Act5_1, Act6='null')
                                              ;(Template='template_4_1', Act2=Act2_1, Act3=Act3_1, Act4=Act4_1, Act5=Act5_1, Act6=Act6_1)))).




         pattern(rule_4, [Pattern, Template, Status, Act1, Act2, Act3, Act4, Act5, Act6])

          :- (operation_log(datetime(Act1), ibss_log( Qnode1, Activity1, Type1, Concept1, _, _)), Type1=='prepared_question', Activity1\=='add'),

             operation_log(datetime(Act2_1), ibss_log( Anode1, Activity2, 'answer', _, _, Qnode1)),

             (operation_log(datetime(Act3_1), ibss_log( Anode1, 'edit', 'answer', _, _, Qnode1)), newestDate_at_time(Act3_1, Anode1, Act2_1)),

             (operation_log(datetime(Act4_1), ibss_log( Qnode2, Activity4, Type4, Concept4, _, _)), Concept1 \== Concept4, class_out(Concept1, Concept4), Type4=='prepared_question', Activity4\=='add'),

             (operation_log(datetime(Act5_1), ibss_log( Anode2, Activity5, 'answer', _, _, Qnode2)), Activity5\=='add', Activity5\=='delete', time_compare(Act3_1,Act5_1,Act3_1), newestDate_at_time(Act3_1, Anode2, Act5_1)),

             ((operation_log(datetime(Act6_1), ibss_log( Anode2, 'edit', 'answer', _, _, _)),

              newestDate_at_time(Act6_1, Qnode1, Act1), newestDate_at_time(Act6_1, Anode1, Act3_1), newestDate_at_time(Act6_1, Qnode2, Act4_1), newestDate_at_time(Act6_1, Anode2, Act5_1))

                  ->(Status='full', Pattern='pattern_5',
                        ((Activity2='add')->(Template='template_3_2', Act2=Act3_1, Act3=Act4_1, Act4=Act5_1, Act5=Act6_1, Act6='null')
                                            ;(Template='template_3_1', Act2=Act2_1, Act3=Act3_1, Act4=Act4_1, Act5=Act5_1, Act6=Act6_1)))

                    ;(Status='fail', Pattern='pattern_6',
                          ((Activity2='add')->(Template='template_5_2', Act2=Act3_1, Act3=Act4_1, Act4=Act5_1, Act5=Act5_1, Act6='null')
                                              ;(Template='template_5_1', Act2=Act2_1, Act3=Act3_1, Act4=Act4_1, Act5=Act5_1, Act6=Act6_1)))).


        pattern(rule_5, [Pattern, Template, Status, Act1, Act2, Act3, Act4, Act5, Act6])

         :- (operation_log(datetime(Act1), ibss_log( Qnode1, Activity1, Type1, Concept1, _, _)), Type1=='prepared_question', Activity1\=='add'),

            operation_log(datetime(Act2_1), ibss_log( Anode1, Activity2, 'answer', _, _, Qnode1)),

            (operation_log(datetime(Act3_1), ibss_log( Anode1, 'edit', 'answer', _, _, Qnode1)), newestDate_at_time(Act3_1, Anode1, Act2_1)),

            (operation_log(datetime(Act4_1), ibss_log( Qnode2, Activity4, Type4, Concept4, _, _)), Concept1 \== Concept4, class_activity(Concept1, Concept4), Type4=='prepared_question', Activity4\=='add'),

            (operation_log(datetime(Act5_1), ibss_log( Anode2, Activity5, 'answer', _, _, Qnode2)), Activity5\=='add', Activity5\=='delete', time_compare(Act3_1,Act5_1,Act3_1), newestDate_at_time(Act3_1, Anode2, Act5_1)),

            ((operation_log(datetime(Act6_1), ibss_log( Anode2, 'edit', 'answer', _, _, _)),

             newestDate_at_time(Act6_1, Qnode1, Act1), newestDate_at_time(Act6_1, Anode1, Act3_1), newestDate_at_time(Act6_1, Qnode2, Act4_1), newestDate_at_time(Act6_1, Anode2, Act5_1))

                 ->(Status='full', Pattern='pattern_7',
                       ((Activity2='add')->(Template='template_1_2', Act2=Act3_1, Act3=Act4_1, Act4=Act5_1, Act5=Act6_1, Act6='null')
                                           ;(Template='template_1_1', Act2=Act2_1, Act3=Act3_1, Act4=Act4_1, Act5=Act5_1, Act6=Act6_1)))

                   ;(Status='fail', Pattern='pattern_8',
                         ((Activity2='add')->(Template='template_6_2', Act2=Act3_1, Act3=Act4_1, Act4=Act5_1, Act5=Act6_1, Act6='null')
                                             ;(Template='template_6_1', Act2=Act2_1, Act3=Act3_1, Act4=Act4_1, Act5=Act5_1, Act6=Act6_1)))).






%６. (real pattern_9) ある答えノードを編集した後，そのサブ活動の答えノードを編集すること

        pattern(rule_6, [Pattern, Template, Status, Act1, Act2, Act3, Act4, Act5, Act6])

         :- (operation_log(datetime(Act1), ibss_log( Qnode1, Activity1, Type1, Concept1, _, _)), Type1=='prepared_question', Activity1\=='add'),

            operation_log(datetime(Act2_1), ibss_log( Anode1, Activity2, 'answer', _, _, Qnode1)),

            (operation_log(datetime(Act3_1), ibss_log( Anode1, 'edit', 'answer', _, _, Qnode1)), newestDate_at_time(Act3_1, Anode1, Act2_1)),

            (operation_log(datetime(Act4_1), ibss_log( Qnode2, Activity4, Type4, Concept4, _, _)), Concept1 \== Concept4, class_activity(CONCEPT_master, Concept1), class_activity(CONCEPT_master, Concept4), Type4=='prepared_question', Activity4\=='add'),

            (operation_log(datetime(Act5_1), ibss_log( Anode2, Activity5, 'answer', _, _, Qnode2)), Activity5\=='add', Activity5\=='delete', time_compare(Act3_1,Act5_1,Act3_1), newestDate_at_time(Act3_1, Anode2, Act5_1)),

            ((operation_log(datetime(Act6_1), ibss_log( Anode2, 'edit', 'answer', _, _, _)),

             newestDate_at_time(Act6_1, Qnode1, Act1), newestDate_at_time(Act6_1, Anode1, Act3_1), newestDate_at_time(Act6_1, Qnode2, Act4_1), newestDate_at_time(Act6_1, Anode2, Act5_1))

                 ->(Status='full', Pattern='pattern_9',
                       ((Activity2='add')->(Template='template_1_2', Act2=Act3_1, Act3=Act4_1, Act4=Act5_1, Act5=Act6_1, Act6='null')
                                           ;(Template='template_1_1', Act2=Act2_1, Act3=Act3_1, Act4=Act4_1, Act5=Act5_1, Act6=Act6_1)))

                   ;(Status='fail', Pattern='pattern_10',
                         ((Activity2='add')->(Template='template_6_2', Act2=Act3_1, Act3=Act4_1, Act4=Act5_1, Act5=Act5_1, Act6='null')
                                             ;(Template='template_6_1', Act2=Act2_1, Act3=Act3_1, Act4=Act4_1, Act5=Act5_1, Act6=Act6_1)))).




%７. (real pattern_11) ある答えノードを編集した後，その合理性の答えノードを編集すること
pattern(rule_7, [Pattern, Template, Status, Act1, Act2, Act3, Act4, Act5, Act6])

 :- (operation_log(datetime(Act1), ibss_log( Qnode1, Activity1, Type1, Concept1, _, _)), Type1=='prepared_question', Activity1\=='add'),

    operation_log(datetime(Act2_1), ibss_log( Anode1, Activity2, 'answer', _, _, Qnode1)),

    (operation_log(datetime(Act3_1), ibss_log( Anode1, 'edit', 'answer', _, _, Qnode1)), newestDate_at_time(Act3_1, Anode1, Act2_1)),

    (operation_log(datetime(Act4_1), ibss_log( Qnode2, Activity4, Type4, Concept4, _, _)), Concept1 \== Concept4, (rationality(Concept1, Concept4);rationality(Concept4, Concept1)), Type4=='prepared_question', Activity4\=='add'),

    (operation_log(datetime(Act5_1), ibss_log( Anode2, Activity5, 'answer', _, _, Qnode2)), Activity5\=='add', Activity5\=='delete', time_compare(Act3_1,Act5_1,Act3_1), newestDate_at_time(Act3_1, Anode2, Act5_1)),

    ((operation_log(datetime(Act6_1), ibss_log( Anode2, 'edit', 'answer', _, _, _)),

     newestDate_at_time(Act6_1, Qnode1, Act1), newestDate_at_time(Act6_1, Anode1, Act3_1), newestDate_at_time(Act6_1, Qnode2, Act4_1), newestDate_at_time(Act6_1, Anode2, Act5_1))

         ->(Status='full', Pattern='pattern_11',
               ((Activity2='add')->(Template='template_7_2', Act2=Act3_1, Act3=Act4_1, Act4=Act5_1, Act5=Act6_1, Act6='null')
                                   ;(Template='template_7_1', Act2=Act2_1, Act3=Act3_1, Act4=Act4_1, Act5=Act5_1, Act6=Act6_1)))

           ;(Status='fail', Pattern='pattern_12',
                 ((Activity2='add')->(Template='template_8_2', Act2=Act3_1, Act3=Act4_1, Act4=Act5_1, Act5=Act5_1, Act6='null')
                                     ;(Template='template_8_1', Act2=Act2_1, Act3=Act3_1, Act4=Act4_1, Act5=Act5_1, Act6=Act6_1)))).




%８. (real pattern_13) 考えないことを考えた(合理性以外)
pattern(rule_8, [Pattern, Template, Status, T1date, Act1])

:- (operation_log(datetime(R1), reflection_log( TemplateR1, 'not_think', '0', T1date, Tid, _, _, '',targets(_))),TemplateR1\=='template_8_1', TemplateR1\=='template_8_2'),

   (operation_log(datetime(Act1), ibss_log( Tid, 'edit', _, _, _, _)), time_compare(Act1, R1, Act1)), Status='reason', Template='template_9', Pattern='pattern_13'.
% 考えないと意思決定していた『%S』について，今回意思決定を変更し『%S』と再考しました．なぜ今回意思決定を変更しましたか？

% operation_log(datetime('2019-01-25 08:17:51.497'), reflection_log( 'template_6_1', 'not_think', '0', '2019-01-25 08:12:13.145', '88222386024feff5', '', '『実践の目的は何ですか？』について，『システムの効果の確認』を再考し『フィードバックの効果の確認』と変更したことに伴い，『実践の手順はどのようなものですか？』の『1習慣のテスト利用』についても再考しましたか？', '',targets(['2019-01-25 08:10:07.308', '2019-01-25 08:10:39.191', '2019-01-25 08:13:07.191', '2019-01-25 08:11:45.172', '2019-01-25 08:12:13.145']))).
% operation_log(datetime('2019-01-25 08:18:52.556'), ibss_log( '88222386024feff5', 'edit', 'answer', '1509010690552_n141', '10日間の運営後，事前評価を行う', '88222300b1045101')).


% operation_log(datetime(_), reflection_log( Reflection_Tamplated, 'not_think', '0', '2019-01-24 08:29:00.961', '87d0b79a4627fa1b', '2019-01-24 08:28:48.499', '『実践仮説は何ですか？』について，『実践仮説なんて知らない』と追加したことに伴い，『実践の目的は何ですか？』の『実践目的なんて知らない』との合理性を考えましたか？', '',targets(['2019-01-24 08:29:03.560', '2019-01-24 08:29:14.035', '2019-01-24 08:28:48.499', '2019-01-24 08:29:00.961', '2019-01-24 08:29:00.961', 'null']))).


 %９. (real pattern_14) 考えないことを考えた(合理性)
 pattern(rule_9, [Pattern, Template, Status, Rdate, T1date, Act1])

 :- (operation_log(datetime(R1), reflection_log( TemplateR1, 'not_think', '0', T1date, T1id, Rdate, _, _,targets(_))),TemplateR1=='template_8_1';TemplateR1=='template_8_2'),

    operation_log(datetime(Act1), ibss_log( T1id, _, _, _, _, _)), time_compare(Act1, R1, Act1),

    Status='reason', Template='template_10', Pattern='pattern_14'.


% 考えないと意思決定していた『%S』と『%S』の合理性について，今回意思決定を変更し考えました．なぜ今回意思決定を変更しましたか？

:- pattern(rule_1,X),writef('%t\n',[X]),fail;true.
:- pattern(rule_2,X),writef('%t\n',[X]),fail;true.
:- pattern(rule_3,X),writef('%t\n',[X]),fail;true.
:- pattern(rule_4,X),writef('%t\n',[X]),fail;true.
:- pattern(rule_5,X),writef('%t\n',[X]),fail;true.
:- pattern(rule_6,X),writef('%t\n',[X]),fail;true.
:- pattern(rule_7,X),writef('%t\n',[X]),fail;true.
:- pattern(rule_8,X),writef('%t\n',[X]),fail;true.
:- pattern(rule_9,X),writef('%t\n',[X]),fail;true.







:- halt.
