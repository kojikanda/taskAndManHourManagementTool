package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.UserResponse;
import com.example.taskmanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * ユーザのコントローラークラス
 */
@RestController
@RequiredArgsConstructor
public class UserController {

    /**
     * ユーザサービス
     */
    private final UserService userService;

    /**
     * ユーザ一覧取得
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers()
                .stream()
                .map(UserResponse::from)
                .toList();
        return ResponseEntity.ok(users);
    }
}
