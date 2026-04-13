package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.LoginRequest;
import com.example.taskmanagement.dto.LoginResponse;
import com.example.taskmanagement.dto.RegisterRequest;
import com.example.taskmanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 認証関連のコントローラークラス
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    /**
     * ユーザーサービス
     */
    private final UserService userService;

    /**
     * ユーザー登録
     * 
     * @param request 登録リクエストDTO
     * @return レスポンス
     */
    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody RegisterRequest request) {
        userService.createUser(request.getName(), request.getEmail(), request.getPassword());
        return ResponseEntity.ok().build();
    }

    /**
     * ログイン
     * 
     * @param request ログインリクエストDTO
     * @return ログインレスポンスDTO（JWTトークンを含む）
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = userService.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(response);
    }
}
