# from .models import Tournament, CustomUser



# # in progress 
# class TournamentService:
#     @staticmethod
#     def start_tournament(tournament):
#         tournament.status = Tournament.IN_PROGRESS
#         tournament.generate_schedule()

#         for game in tournament.schedule:
#             player1_id, player2_id = game
#             player1 = CustomUser.objects.get(id=player1_id)
#             player2 = CustomUser.objects.get(id=player2_id)

#             player1_score, player2_score = simulate_game(player1, player2)

#             tournament.update_participant_points(player1_id, player1_score, player2_score)
#             tournament.update_participant_points(player2_id, player2_score, player1_score)

#         if tournament.is_tournament_finished():
#             tournament.status = Tournament.FINISHED
#         else:
#             # Do something if tournament is not finished
#             pass

#         tournament.save()

#     @staticmethod
#     def is_tournament_finished(tournament):
#         return all(participant_id in tournament.participant_points for participant_id in tournament.participants.values_list('id', flat=True))